import type { SgNode } from "@ast-grep/napi";
import type * as vscode from "vscode";
import { Effect } from "effect";
import { type FlowKind, flowKinds } from "./ast.schema";
import { getCodeRangeFromSgNode } from "../../utils/get-range";
import type { CodeBlock } from "../llm/llm.schema";
import { getAllPythonFlowASTs } from "./get-all-flows";
import {
	handleExpression,
	type HandleExpressionErrors,
} from "./handle-expressions";

class NoBlockFoundError {
	readonly _tag = "NoBlockFoundError";
	readonly message = "No block found";
}
class InvalidExpressionStatementError {
	readonly _tag = "InvalidExpressionStatementError";
	readonly message = "Invalid expression statement";
}

// input type
interface Props {
	node: SgNode;
	kind: FlowKind;
	parent_id: string;
	i: number;
	url: vscode.Uri;
}
// output type
type OutputEffect = Effect.Effect<
	CodeBlock,
	NoBlockFoundError | InvalidExpressionStatementError | HandleExpressionErrors
>;

/**
 * Gets the AST for a single flow SgNode
 *
 * @returns an Effect that succeeds with {@link CodeBlock} if the node is successfully parsed
 */
export function getFlowAST({
	node,
	kind,
	parent_id,
	i,
	url,
}: Props): OutputEffect {
	return Effect.gen(function* () {
		switch (kind) {
			case "while_statement":
			case "for_statement":
			case "try_statement":
			case "elif_clause":
			case "else_clause":
			case "finally_clause":
			case "except_clause":
			case "if_statement": {
				// find the block child of the current node
				const block = node.children().find((x) => x.kind() === "block");
				const to_be_removed = node
					.children()
					.filter((x) =>
						[
							"else_clause",
							"elif_clause",
							"except_clause",
							"finally_clause",
						].some((k) => k === x.kind()),
					);
				if (!block) {
					return yield* Effect.fail(new NoBlockFoundError());
				}

				// recursively get the AST for all the flows in the block
				const children = yield* getAllPythonFlowASTs({
					root: block.children(),
					parent_id: parent_id !== "" ? `${parent_id}.${i}` : `${i}`,
					url,
				});

				// replace the block body with a placeholder
				const edits = [
					block.replace(`<${kind}_body/>`),
					...to_be_removed.map((x) => x.replace("")),
				];
				const text = node.commitEdits(edits);

				return yield* Effect.succeed({
					id: parent_id !== "" ? `${parent_id}.${i}` : `${i}`,
					text: text.trim(),
					range: getCodeRangeFromSgNode(node),
					filePath: url.fsPath,
					children,
				});
			}

			case "expression_statement": {
				// `expression_statement` always has a single child
				// which is the `expression` we care about
				const children = node.children();
				if (children.length !== 1) {
					console.error(node.text());
					return yield* Effect.fail(new InvalidExpressionStatementError());
				}

				// find all the references in the expression
				// TODO: things like func_c(func_a(), func_b()) aren't really handled
				const {
					refs,
					children: expressionChildren,
					edits,
				} = yield* handleExpression({
					node: children[0],
					url,
					parent_id: parent_id !== "" ? `${parent_id}.${i}` : `${i}`,
					i: 0,
				});

				// create and return the output. Don't include references if there are none
				const output = {
					id: parent_id !== "" ? `${parent_id}.${i}` : `${i}`,
					text: node.commitEdits(edits).trim(),
					range: getCodeRangeFromSgNode(node),
					filePath: url.fsPath,
					children: expressionChildren,
				};
				return yield* Effect.succeed(
					refs.length === 0
						? output
						: {
								...output,
								references: refs,
							},
				);
			}

			case "return_statement": {
				// `return_statement` can have either 1 child (just 'return') or 2 children ('return' and expression)
				const children = node.children();
				if (children.length === 0 || children.length > 2) {
					return yield* Effect.fail(new InvalidExpressionStatementError());
				}

				// If there's only one child, it's just a return statement
				if (children.length === 1) {
					return yield* Effect.succeed({
						id: parent_id !== "" ? `${parent_id}.${i}` : `${i}`,
						text: node.text().trim(),
						range: getCodeRangeFromSgNode(node),
						children: [],
						filePath: url.fsPath,
					});
				}

				// Handle case with expression
				const [return_word, expression] = children;
				const {
					refs,
					children: expressionChildren,
					edits,
				} = yield* handleExpression({
					node: expression,
					url,
					parent_id: parent_id !== "" ? `${parent_id}.${i}` : `${i}`,
					i: 0,
				});

				// create and return the output. Don't include references if there are none
				const output = {
					id: parent_id !== "" ? `${parent_id}.${i}` : `${i}`,
					text: node.commitEdits(edits).trim(),
					range: getCodeRangeFromSgNode(node),
					filePath: url.fsPath,
					children: expressionChildren,
				};
				return yield* Effect.succeed(
					refs.length === 0
						? output
						: {
								...output,
								references: refs,
							},
				);
			}
		}
		return yield* Effect.fail(new NoBlockFoundError());
	});
}
