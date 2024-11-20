import type { SgNode } from "@ast-grep/napi";
import type { FlowKind } from "../types/ast.schema";
import type { LLMBlock } from "../types/llm.types";
import { handleExpression } from "./expression.handler";
import type { Scope } from "../types/graph.types";
import { handleFlows } from "./root.handler";
import type { ThisModulePath } from "./import.handler";

function handleNodeWithBlock(
	node: SgNode,
	id: number,
	scope: Scope,
	replaceWith: string,
	filePath: ThisModulePath,
): LLMBlock {
	const block = node.children().find((x) => x.kind() === "block");
	if (!block || block.kind() !== "block") {
		throw "NoBlockFound";
	}

	const children = handleFlows(block.children(), filePath, scope);

	const edit = block.replace(replaceWith);
	const text = node.commitEdits([edit]);
	return { id, text, children: children.blocks };
}

export function handleFlow(
	node: SgNode,
	kind: FlowKind,
	id: number,
	scope: Scope,
	filePath: ThisModulePath,
): LLMBlock {
	switch (kind) {
		case "if_statement": {
			return handleNodeWithBlock(node, id, scope, "<if_body/>", filePath);
		}

		case "for_statement": {
			return handleNodeWithBlock(node, id, scope, "<for_body/>", filePath);
		}

		case "while_statement": {
			return handleNodeWithBlock(node, id, scope, "<while_body/>", filePath);
		}

		case "expression_statement": {
			const children = node.children();
			if (children.length !== 1) {
				throw "InvalidExpressionStatement";
			}
			const ref = handleExpression(children[0], scope);

			if (ref.length === 0) {
				return { id, text: node.text() };
			}

			return { id, text: node.text(), references: ref };
		}

		default: {
			console.log("unknown type: ", node.kind());
			throw new Error("Unknown Type");
		}
	}
}
