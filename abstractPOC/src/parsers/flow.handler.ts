import type { SgNode } from "@ast-grep/napi";
import type { FlowKind } from "../types/ast.schema";
import type { LLMBlock } from "../types/llm.types";
import { handleExpression } from "./expression.handler";
import type { Scope } from "../types/graph.types";
import { handleFlows } from "./root.handler";

function handleNodeWithBlock(
	node: SgNode,
	id: number,
	replaceWith: string,
): LLMBlock {
	const block = node.children().find((x) => x.kind() === "block");
	if (!block || block.kind() !== "block") {
		throw "NoBlockFound";
	}

	const children = handleFlows(block.children());

	const edit = block.replace(replaceWith);
	const text = node.commitEdits([edit]);
	return { id, text, children };
}

export function handleFlow(
	node: SgNode,
	kind: FlowKind,
	id: number,
	scope: Scope,
): LLMBlock {
	switch (kind) {
		case "if_statement": {
			return handleNodeWithBlock(node, id, "<if_body/>");
		}

		case "for_statement": {
			return handleNodeWithBlock(node, id, "<for_body/>");
		}

		case "while_statement": {
			return handleNodeWithBlock(node, id, "<while_body/>");
		}

		case "expression_statement": {
			const children = node.children();
			if (children.length !== 1) {
				throw "InvalidExpressionStatement";
			}
			const ref = handleExpression(children[0], scope);

			return { id, text: node.text(), references: ref };
		}

		default: {
			console.log("unknown type: ", node.kind());
			throw new Error("Unknown Type");
		}
	}
}
