import { parse, Lang, type SgNode, type SgRoot } from "@ast-grep/napi";
import fs from "node:fs";
import {
	type FlowKind,
	flowKinds,
	type DefinitionKind,
	definitionKinds,
	type ImportKind,
	importKinds,
} from "../types/ast.schema";
import type { LLMBlock, Reference } from "../types/llm.types";
import { handleImport } from "./import.handler";
import { handleFlow } from "./flow.handler";

// const filePath = "PythonQuest/expression_test.py";
// const source = fs.readFileSync(filePath, "utf-8");
// const ast = parse(Lang.Python, source);
// const root = ast.root();

export type ScopeItem =
	| {
			name: string;
			node: SgNode | null;
			kind: "function" | "class" | "variable";
	  }
	| {
			name: string;
			node: SgRoot | null;
			kind: "module";
	  }
	| {
			name: string;
			node: ScopeItem;
			kind: "alias" | "function";
	  };

export type Scope = ScopeItem[];

function handleFlows(nodes: SgNode[]): LLMBlock[] {
	const scope: Scope = [];
	const output: LLMBlock[] = [];

	for (let i = 0; i < nodes.length; i++) {
		const kind = nodes[i].kind();

		// handle definitions
		if (definitionKinds.some((defKinds) => defKinds === kind)) {
			const identifier = nodes[i]
				.children()
				.find((x) => x.kind() === "identifier");

			if (!identifier) {
				throw new Error(`No identifier found for ${nodes[i].kind()}`);
			}

			scope.push({
				name: identifier.text(),
				node: nodes[i],
				kind: nodes[i].kind() === "class_definition" ? "class" : "function",
			});
			continue;
		}

		// handle imports
		if (importKinds.some((impKinds) => impKinds === kind)) {
			// changes scope in place
			handleImport(nodes[i], kind as ImportKind, scope);
			continue;
		}

		// handle flows
		if (flowKinds.some((flowKinds) => flowKinds === kind)) {
			output.push(handleFlow(nodes[i], kind as FlowKind, i, scope));
		}
	}

	return output;
}

function handleFile(filePath: string): LLMBlock[] {
	const source = fs.readFileSync(filePath, "utf-8");
	const ast = parse(Lang.Python, source);
	const root = ast.root();
	return handleFlows(root.children());
}

export { handleFlows, handleImport, handleFile };
