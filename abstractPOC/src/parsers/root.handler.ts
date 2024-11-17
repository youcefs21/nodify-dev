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
import type { FlowOutput, LLMBlock, Reference } from "../types/llm.types";
import { handleImport } from "./import.handler";
import { handleFlow } from "./flow.handler";
import type { Scope } from "../types/graph.types";

// const filePath = "PythonQuest/expression_test.py";
// const source = fs.readFileSync(filePath, "utf-8");
// const ast = parse(Lang.Python, source);
// const root = ast.root();

function handleFlows(nodes: SgNode[]): FlowOutput {
	const scope: Scope = [];
	const blocks: LLMBlock[] = [];

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
			blocks.push(handleFlow(nodes[i], kind as FlowKind, i, scope));
		}
	}

	return { scope, blocks };
}

function handleFile(filePath: string): FlowOutput {
	const source = fs.readFileSync(filePath, "utf-8");
	const ast = parse(Lang.Python, source);
	const root = ast.root();
	return handleFlows(root.children());
}

export { handleFlows, handleImport, handleFile };
