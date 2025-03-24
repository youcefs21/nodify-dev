import * as vscode from "vscode";
import { Lang, type SgNode } from "@ast-grep/napi";
import { Effect } from "effect";
import { ignoreKinds } from "./ast.schema";
import type { CodeBlock, CodeReference } from "../llm/llm.schema";
import { getDefinition } from "../../vsc/builtin";
import type { UnknownException } from "effect/Cause";
import {
	getIdentifierBody,
	type NoParentBodyRangeFound,
} from "../get-definition";
import { OutputEffect } from "./get-flow";
import { getCodeRangeFromSgNode } from "../../utils/get-range";

class NoIdentifierOrAttributeFound {
	readonly _tag = "NoIdentifierOrAttributeFound";
	readonly message = "No identifier or attribute found";
}

class NoArgumentsFound {
	readonly _tag = "NoArgumentsFound";
	readonly message = "No arguments found";
}

export type HandleExpressionErrors =
	| UnknownException
	| NoParentBodyRangeFound
	| NoIdentifierOrAttributeFound
	| NoArgumentsFound;
interface Props {
	node: SgNode;
	url: vscode.Uri;
	parent_id: string;
	i: number;
}

export function getFullNodeJson(node: SgNode): Record<string, unknown> {
	return {
		kind: node.kind(),
		text: node.text(),
		children: node.children().map(getFullNodeJson),
	};
}

type Output = {
	children: CodeBlock[];
	refs: CodeReference[];
};

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
	parent_id,
	i,
}: Props): Effect.Effect<Output, HandleExpressionErrors> {
	// Skip processing for basic syntax elements that don't contain meaningful references
	if (ignoreKinds.some((kind) => kind === node.kind())) {
		return Effect.succeed({
			children: [],
			refs: [],
		});
	}

	return Effect.gen(function* () {
		switch (node.kind()) {
			case "call_expression": {
				// chained calls are represented in the ast from the bottom up
				// a().b().c() is represented as c -> [b -> [a]]
				// call_expression: a().b().c()
				//   1. member_expression: "a().b().c"
				//      1.1: call_expression: "a().b()"
				//         ... and so on for each call
				//      1.2: "."
				//      1.3: property_identifier: "c"
				//   2. arguments: Expression[] from the args of the c() call

				// I need to inverse the children that come from processing chained calls

				// arguments are the children of the call_expression
				// chained call expressions should be flattened, since it executes in order from top down

				// but for top level calls, a()
				// the first child is identifier ("a")

				const callerIdentifier = node.children()[0];
				if (callerIdentifier.kind() === "member_expression") {
					// this should in theory have 2 children:
					// 1. call_expression: "b()"
					// 2. property_identifier: "c"
					const parentCall = yield* handleExpression({
						node: callerIdentifier,
						url,
						parent_id,
						i,
					});

					// process the args expressions
					const args = node.children()[1];
					if (args.kind() !== "arguments") {
						console.warn(
							`Expected arguments for call_expression ${node.text()} at ${url.fsPath}:${node.range().start.line}:${node.range().start.column}`,
						);
						return yield* Effect.fail(new NoArgumentsFound());
					}

					const argsRefs = yield* Effect.forEach(
						args.children(),
						(arg) =>
							handleExpression({
								node: arg,
								url,
								parent_id,
								i,
							}).pipe(
								Effect.map((x) => ({
									...x,
									node: arg,
								})),
							),
						{ concurrency: 5 },
					);

					const result = argsRefs.map(
						(arg) =>
							({
								id: parent_id !== "" ? `${parent_id}.${i}` : `${i}`,
								text: arg.node.text(),
								range: getCodeRangeFromSgNode(arg.node),
								filePath: url.fsPath,
								references: arg.refs,
								children: arg.children,
							}) satisfies CodeBlock,
					);

					// I want to put the args expressions in the children of the property_identifier
					parentCall.children[parentCall.children.length - 1].children?.push(
						...result,
					);

					return parentCall;
				}

				return {
					children: [],
					refs: [],
				};
			}

			case "member_expression": {
				const parent = node.children()[0];
				const property_identifier = node.children()[2];
				// the parent could either be a call_expression or a member_expression

				// "a().c" (parent is call_expression "a()")
				if (parent.kind() === "call_expression") {
					// it would return the ref of thing thing calling, and children (args expressions)
					const parentCall = yield* handleExpression({
						node: parent,
						url,
						parent_id,
						i,
					});
					// this just returns the ref of c (the property_identifier)
					const { refs: propIdentifierRefs } = yield* handleExpression({
						node: property_identifier,
						url,
						parent_id,
						i,
					});
					return {
						refs: parentCall.refs,
						children: [
							...parentCall.children,
							{
								id: parent_id !== "" ? `${parent_id}.${i + 1}` : `${i + 1}`,
								text: property_identifier.text().trim(),
								range: getCodeRangeFromSgNode(property_identifier),
								filePath: url.fsPath,
								references: propIdentifierRefs,
								children: [],
							},
						],
					};
				}

				// "a.c" (parent is identifier "a")
				if (parent.kind() === "identifier") {
					const parentIdentifier = yield* handleExpression({
						node: parent,
						url,
						parent_id,
						i,
					});
					const { refs: propIdentifierRefs } = yield* handleExpression({
						node: property_identifier,
						url,
						parent_id,
						i,
					});
					return {
						refs: [],
						children: [
							{
								id: parent_id !== "" ? `${parent_id}.${i}` : `${i}`,
								text: parent.text().trim(),
								range: getCodeRangeFromSgNode(parent),
								filePath: url.fsPath,
								references: parentIdentifier.refs,
								children: parentIdentifier.children,
							},
							{
								id: parent_id !== "" ? `${parent_id}.${i + 1}` : `${i + 1}`,
								text: property_identifier.text().trim(),
								range: getCodeRangeFromSgNode(property_identifier),
								filePath: url.fsPath,
								references: propIdentifierRefs,
								children: [],
							},
						],
					};
				}

				console.warn(
					`No identifier or attribute found for ${node.text()} at ${url.fsPath}:${node.range().start.line}:${node.range().start.column}`,
				);
				return yield* Effect.fail(new NoIdentifierOrAttributeFound());
			}

			case "property_identifier":
			case "identifier": {
				const location = node.range().end;

				// Resolve the symbol to its definition using VSCode's definition provider
				const definitions = yield* getDefinition(
					url,
					new vscode.Position(location.line, location.column),
				);
				if (definitions.length === 0) {
					console.warn(
						`No definitions found for ${node.text()} at ${url.fsPath}:${location.line}:${location.column}`,
					);
					return {
						children: [],
						refs: [],
					};
				}

				// Extract the full range of the definition's body for reference mapping
				const definitionRanges = yield* Effect.forEach(
					definitions,
					(def) => getIdentifierBody(def, Lang.TypeScript),
					{ concurrency: 5 },
				);

				return {
					refs: definitionRanges
						.filter((range) => range !== undefined)
						.filter((range) => range.isInWorkspace)
						.map((range) => ({
							symbol: node.text(),
							id: range.shortId,
							fullHash: range.fullHash,
							body: range.text,
							range: range.range,
							filePath: range.uri.fsPath,
							lang: Lang.TypeScript,
						})),
					children: [],
				};
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
					(x) => handleExpression({ node: x, url, parent_id, i }),
					{ concurrency: 5 },
				);
				return x.reduce(
					(acc, curr) => {
						return {
							children: [...acc.children, ...curr.children],
							refs: [...acc.refs, ...curr.refs],
						};
					},
					{ children: [], refs: [] },
				);
			}
		}

		return {
			children: [],
			refs: [],
		};
	});
}
