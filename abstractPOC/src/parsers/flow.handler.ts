import type { SgNode } from "@ast-grep/napi";
import type { FlowKind } from "../types/ast.schema";
import type { LLMBlock } from "../types/llm.types";
import { handleFlows, type Scope } from "./handlers";
import { handleExpression } from "./expression.handler";

export function handleFlow(
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
			// handle variable assignment
			const childrenText = node.children().map((x) => {
				return {
					kind: x.kind(),
					text: x.text(),
					children: x.children().map((y) => ({
						kind: y.kind(),
						text: y.text(),
					})),
				};
			});
			// console.log("expression_statement children: ", childrenText);

			const children = node.children();
			if (children.length !== 1) {
				throw "InvalidExpressionStatement";
			}
			const ref = handleExpression(children[0], scope);
			// console.log("ref obj for expression_statement: ", ref);

			// handle variable assignment

			// calling functions
			// add reference to most recent function/class index in scope
			return { id, text: node.text(), references: ref };
		}

		default: {
			console.log("unknown type: ", node.kind());
			throw new Error("Unknown Type");
		}
	}
}
