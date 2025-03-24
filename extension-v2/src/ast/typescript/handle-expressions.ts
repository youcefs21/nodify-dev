import * as vscode from "vscode";
import { Lang, type SgNode } from "@ast-grep/napi";
import { Effect } from "effect";
import { ignoreKinds } from "./ast.schema";
import type { CodeReference } from "../llm/llm.schema";
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
 * Analyzes TypeScript AST expressions:
 * 1. Call expressions/member expressions: Resolves identifier to definition
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

	return Effect.gen(function* () {
		switch (node.kind()) {
			case "member_expression":
			case "call_expression": {
				// Extract the identifier or member expression that's being called/accessed
				const identifier = node
					.children()
					.find(
						(x) =>
							x.kind() === "identifier" ||
							x.kind() === "property_identifier" ||
							x.kind() === "member_expression",
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
					(def) => getIdentifierBody(def, Lang.TypeScript),
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
						lang: Lang.TypeScript,
					}));
			}

			// For compound expressions, recursively process all child nodes
			// to build a complete reference graph
			case "ternary_expression":
			case "binary_expression":
			case "parenthesized_expression":
			case "array":
			case "object":
			case "pair":
			case "template_string":
			case "subscript_expression":
			case "unary_expression":
			case "assignment_expression":
			case "await_expression":
			case "yield_expression":
			case "generator_function":
			case "lexical_declaration":
			case "variable_declarator":
			case "new_expression": {
				// Process all children concurrently
				const x = yield* Effect.forEach(
					node.children(),
					(x) => handleExpression({ node: x, url }),
					{ concurrency: 5 },
				);
				return x.flat();
			}
		}

		return [];
	});
}
