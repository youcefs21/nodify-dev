import * as vscode from "vscode";
import { Lang, type SgNode } from "@ast-grep/napi";
import { Effect } from "effect";
import { type CodeReference, ignoreKinds } from "./ast.schema";
import { getDefinition } from "../../vsc/builtin";
import type { UnknownException } from "effect/Cause";
import {
	getIdentifierBody,
	type NoParentBodyRangeFound,
} from "../get-definition";

class NoIdentifierOrAttributeFound {
	readonly _tag = "NoIdentifierOrAttributeFound";
	readonly message = "No identifier or attribute found";
}

export type HandleExpressionErrors =
	| UnknownException
	| NoParentBodyRangeFound
	| NoIdentifierOrAttributeFound;

interface Props {
	node: SgNode;
	url: vscode.Uri;
}

export function getFullNodeJson(node: SgNode): Record<string, unknown> {
	return {
		kind: node.kind(),
		text: node.text(),
		children: node.children().map(getFullNodeJson),
	};
}

/**
 * Processes AST expressions to extract code references and definitions.
 *
 * Analyzes Python AST expressions:
 * 1. Call expressions/attributes: Resolves identifier to definition
 * 2. Compound expressions: Recursively processes child nodes
 *
 * Creates dependency graph for code flow visualization.
 *
 * @returns Effect with {@link CodeReference[]} linking symbols to definitions
 */
export function handleExpression({
	node,
	url,
}: Props): Effect.Effect<CodeReference[], HandleExpressionErrors> {
	// Skip processing for basic syntax elements that don't contain meaningful references
	if (ignoreKinds.some((kind) => kind === node.kind())) {
		return Effect.succeed([]);
	}

	// console.log("called handleExpression with", node.kind());
	// console.error(
	// 	`\n\`\`\`\n${JSON.stringify(getFullNodeJson(node), null, 4)}\n\`\`\``,
	// );

	return Effect.gen(function* () {
		switch (node.kind()) {
			case "attribute":
			case "call": {
				// Extract the identifier or attribute that's being called/accessed
				const identifier = node
					.children()
					.find(
						(x) =>
							x.kind() === "identifier" ||
							(x.kind() === "attribute" && x.text() !== "(self)"),
					);
				if (!identifier) {
					return yield* Effect.fail(new NoIdentifierOrAttributeFound());
				}
				const location = identifier.range().end;

				// Resolve the symbol to its definition using VSCode's definition provider
				const definitions = yield* getDefinition(
					url,
					new vscode.Position(location.line, location.column),
				);
				if (definitions.length === 0) {
					console.warn(
						`No definitions found for ${identifier.text()} at ${url.fsPath}:${location.line}:${location.column}`,
					);
					return [];
				}

				// Extract the full range of the definition's body for reference mapping
				const definitionRanges = yield* Effect.forEach(
					definitions,
					(def) => getIdentifierBody(def, Lang.Python),
					{ concurrency: 5 },
				);
				return definitionRanges
					.filter((range) => range !== undefined)
					.filter((range) => range.isInWorkspace)
					.map((range) => ({
						symbol: identifier.text(),
						id: range.shortId,
						fullHash: range.fullHash,
						body: range.text,
						range: range.range,
						filePath: range.uri.fsPath,
					}));
			}

			// For compound expressions, recursively process all child nodes
			// to build a complete reference graph
			case "lambda":
			case "augmented_assignment":
			case "tuple":
			case "set":
			case "list":
			case "dictionary":
			case "pair":
			case "parenthesized_expression":
			case "conditional_expression":
			case "binary_operator":
			case "boolean_operator":
			case "not_operator":
			case "comparison_operator":
			case "string":
			case "interpolation":
			case "subscript":
			case "slice":
			case "generator_expression":
			case "set_comprehension":
			case "tuple_comprehension":
			case "list_comprehension":
			case "dictionary_comprehension":
			case "for_in_clause":
			case "unary_operator":
			case "assignment": {
				// Process all children concurrently
				const x = yield* Effect.forEach(
					node.children(),
					(x) => handleExpression({ node: x, url }),
					{ concurrency: 5 },
				);
				return x.flat();
			}

			case "yield": {
				// For yield expressions, skip the 'yield' keyword (first child)
				// and only process the yielded value(s)
				const children = yield* Effect.forEach(
					node.children().slice(1),
					(x) => handleExpression({ node: x, url }),
					{ concurrency: 5 },
				);
				return children.flat();
			}
		}

		return [];
	});
}
