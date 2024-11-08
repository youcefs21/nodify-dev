import { parse, Lang, type SgNode } from "@ast-grep/napi";
import fs from "node:fs";
import {
	type FlowKind,
	flowKinds,
	type DefinitionKind,
	definitionKinds,
} from "./types/ast.schema";
import type { LLMBlock } from "./types/llm.types";
import { exportJson } from "./utils/exportJson";

const filePath = "PythonQuest/main.py";
const source = fs.readFileSync(filePath, "utf-8");
const ast = parse(Lang.Python, source);
const root = ast.root();

// I need to hold a "scope" array that will keep track of variables, functions, and classes
// currently in scope.

interface Def {
	name: string;
	node: SgNode;
}

type Scope = {
	variables: Def[];
	functions: Def[];
	classes: Def[];
};

function handleFlow(
	node: SgNode,
	kind: FlowKind,
	id: number,
	scope: Scope,
): LLMBlock {
	switch (kind) {
		case "if_statement": {
			const block = node.children().find((x) => x.kind() === "block");
			if (!block || block.kind() !== "block") {
				throw "NoBlockFound";
			}

			const children = handleFlows(block.children());

			const edit = block.replace("<if_body/>");
			const text = node.commitEdits([edit]);
			return { id, text, children };
		}
		case "for_statement": {
			const block = node.children().find((x) => x.kind() === "block");
			if (!block || block.kind() !== "block") {
				throw "NoBlockFound";
			}

			const children = handleFlows(block.children());

			const edit = block.replace("<for_body/>");
			const text = node.commitEdits([edit]);
			return { id, text, children };
		}
		case "while_statement": {
			const block = node.children().find((x) => x.kind() === "block");
			if (!block || block.kind() !== "block") {
				throw "NoBlockFound";
			}

			const children = handleFlows(block.children());

			const edit = block.replace("<while_body/>");
			const text = node.commitEdits([edit]);
			return { id, text, children };
		}
		case "expression_statement": {
			const children = node.children().map((x) => {
				return { kind: x.kind(), text: x.text() };
			});
			// TODO handle variable assignment
			console.log("expression_statement children: ", children);
			return { id, text: node.text() };
		}

		default: {
			console.log("unknown type: ", node.kind());
			throw new Error("Unknown Type");
		}
	}
}

function handleScope(node: SgNode, scope: Scope) {
	switch (node.kind()) {
		case "function_definition": {
			scope.functions.push({ name: node.text(), node });
			break;
		}
		case "class_definition": {
			scope.classes.push({ name: node.text(), node });
			break;
		}
		default: {
			console.log("unknown type: ", node.kind());
			throw new Error("Unknown Type");
		}
	}
	return;
}

function handleFlows(nodes: SgNode[]): LLMBlock[] {
	const scope: Scope = {
		classes: [],
		functions: [],
		variables: [],
	};

	const output: LLMBlock[] = [];
	for (let i = 0; i < nodes.length; i++) {
		const kind = nodes[i].kind();
		if (definitionKinds.includes(kind as DefinitionKind)) {
			handleScope(nodes[i], scope);
		} else if (flowKinds.includes(kind as FlowKind)) {
			output.push(handleFlow(nodes[i], kind as FlowKind, i, scope));
		}
	}

	return output;
}

const rootOut = handleFlows(root.children());
await exportJson("quest", rootOut);
