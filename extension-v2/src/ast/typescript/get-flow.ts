import type { SgNode } from "@ast-grep/napi";
import type * as vscode from "vscode";
import { Effect } from "effect";
import { type FlowKind, flowKinds } from "./ast.schema";
import { getCodeRangeFromSgNode } from "../../utils/get-range";
import type { CodeBlock } from "../llm/llm.schema";
import { getAllTypescriptFlowASTs } from "./get-all-flows";
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
	message = "Invalid expression statement";
	constructor(readonly msg: string) {
		this.message = `Invalid expression statement: ${msg}`;
	}
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
			case "await_expression": {
				// await_expression has two children: "await" keyword and the expression
				const children = node.children();
				if (children.length !== 2) {
					return yield* Effect.fail(
						new InvalidExpressionStatementError(
							`${children.length} children != 2 for await expression`,
						),
					);
				}

				// Get the expression (second child)
				const expression = children[1];

				// Find all references in the expression
				const refs = yield* handleExpression({ node: expression, url });

				// Create and return the output
				const output = {
					id: parent_id !== "" ? `${parent_id}.${i}` : `${i}`,
					text: node.text().trim(),
					range: getCodeRangeFromSgNode(node),
					filePath: url.fsPath,
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

			case "if_statement":
			case "for_statement":
			case "while_statement":
			case "try_statement":
			case "else_clause":
			case "block":
			case "statement_block":
			case "switch_statement":
			case "case_statement":
			case "default_clause": {
				// find the block child of the current node
				const block = node
					.children()
					.find((x) => x.kind() === "statement_block" || x.kind() === "block");

				const to_be_removed = node
					.children()
					.filter((x) =>
						["else_clause", "case_statement", "default_clause"].some(
							(k) => k === x.kind(),
						),
					);

				if (!block) {
					return yield* Effect.fail(new NoBlockFoundError());
				}

				// recursively get the AST for all the flows in the block
				const children = yield* getAllTypescriptFlowASTs({
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
				if (
					children.length < 1 ||
					(children.length === 2 && children[1].kind() !== ";")
				) {
					return yield* Effect.fail(
						new InvalidExpressionStatementError(
							`${children.length} children != 1 for expression statement. Second child is "${children[1].kind()}"`,
						),
					);
				}

				// find all the references in the expression
				const refs = yield* handleExpression({ node: children[0], url });

				// create and return the output. Don't include references if there are none
				const output = {
					id: parent_id !== "" ? `${parent_id}.${i}` : `${i}`,
					text: node.text().trim(),
					range: getCodeRangeFromSgNode(node),
					filePath: url.fsPath,
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
				// `return_statement` can have 1 or 2 children
				const children = node.children();

				// If there's only "return" keyword, no expression
				if (children.length === 1) {
					const output = {
						id: parent_id !== "" ? `${parent_id}.${i}` : `${i}`,
						text: node.text().trim(),
						range: getCodeRangeFromSgNode(node),
						filePath: url.fsPath,
					};
					return yield* Effect.succeed(output);
				}

				// Find the expression (last child)
				const expression = children[children.length - 1];

				// Get the references in the expression
				const refs = yield* handleExpression({ node: expression, url });

				// Create and return the output. Don't include references if there are none
				const output = {
					id: parent_id !== "" ? `${parent_id}.${i}` : `${i}`,
					text: node.text().trim(),
					range: getCodeRangeFromSgNode(node),
					filePath: url.fsPath,
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

			case "lexical_declaration": {
				// Handle variable declarations
				const children = node.children();

				// Process the variable declarator
				const declarator = children.find(
					(child) => child.kind() === "variable_declarator",
				);
				if (!declarator) {
					return yield* Effect.fail(
						new InvalidExpressionStatementError(
							"No variable declarator found for lexical declaration",
						),
					);
				}

				// Find any function or expressions in the value
				const refs = yield* handleExpression({ node: declarator, url });

				// Create output
				const output = {
					id: parent_id !== "" ? `${parent_id}.${i}` : `${i}`,
					text: node.text().trim(),
					range: getCodeRangeFromSgNode(node),
					filePath: url.fsPath,
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
