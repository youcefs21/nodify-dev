import * as vscode from "vscode";
import { type Edit, Lang, type SgNode } from "@ast-grep/napi";
import { Effect } from "effect";
import { getDefinition } from "../../vsc/builtin";
import type { UnknownException } from "effect/Cause";
import {
	getIdentifierBody,
	type NoParentBodyRangeFound,
} from "../get-definition";
import { ignoreKinds } from "./ast.schema";
import type { CodeBlock, CodeReference } from "../llm/llm.schema";
import {
	combineCodeRanges,
	getCodeRangeFromSgNode,
} from "../../utils/get-range";

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
	parent_id: string;
	i: number;
	parent_is_call_expression?: boolean;
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
	edits: Edit[];
};

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
	parent_id,
	i,
	parent_is_call_expression,
}: Props): Effect.Effect<Output, HandleExpressionErrors> {
	// Skip processing for basic syntax elements that don't contain meaningful references
	if (!node || ignoreKinds.some((kind) => kind === node.kind())) {
		return Effect.succeed({
			children: [],
			refs: [],
			edits: [],
		});
	}

	if (i === 0 && (node.kind() === "call" || node.kind() === "attribute")) {
		// I need to precompute the depth of the chained calls, and set i to that depth
		let current = node;
		let depth = 0;
		while (current.kind() === "call" || current.kind() === "attribute") {
			depth++;
			current = current.children()[0];
		}
		i = depth;
	}

	// console.log("called handleExpression with", node.kind());
	// console.error(
	// 	`\n\`\`\`\n${JSON.stringify(getFullNodeJson(node), null, 4)}\n\`\`\``,
	// );

	return Effect.gen(function* () {
		switch (node.kind()) {
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
						edits: [],
					};
				}

				// Extract the full range of the definition's body for reference mapping
				const definitionRanges = yield* Effect.forEach(
					definitions,
					(def) => getIdentifierBody(def, Lang.Python),
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
							lang: Lang.Python,
						})),
					children: [],
					edits: [],
				};
			}
			case "attribute": {
				const parent = node.children()[0];
				const property_identifier = node.children()[2];
				// the parent could either be a call_expression or a member_expression

				// "a().c" (parent is call_expression "a()")
				if (parent.kind() === "call") {
					// it would return the ref of thing thing calling, and children (args expressions)
					const parentCall = yield* handleExpression({
						node: parent,
						url,
						parent_id,
						i: i - 1,
					});
					// this just returns the ref of c (the property_identifier)
					const { refs: propIdentifierRefs, edits: propIdentifierEdits } =
						yield* handleExpression({
							node: property_identifier,
							url,
							parent_id,
							i,
						});
					return {
						refs: parentCall.refs,
						children: [
							...parentCall.children.filter(
								(x) =>
									(x.references?.length ?? 0) > 0 ||
									(x.children?.length ?? 0) > 0,
							),
							{
								id: parent_id !== "" ? `${parent_id}.${i + 1}` : `${i + 1}`,
								text: property_identifier.text().trim(),
								range: getCodeRangeFromSgNode(property_identifier),
								filePath: url.fsPath,
								references: propIdentifierRefs,
								children: [],
							},
						],
						edits: [...parentCall.edits, ...propIdentifierEdits],
					};
				}

				// "a.c" (parent is identifier "a")
				if (
					parent.kind() === "identifier" ||
					parent.kind() === "property_identifier" ||
					parent.kind() === "attribute" ||
					parent.kind() === "subscript_expression" ||
					parent.kind() === "string" ||
					parent.kind() === "concatenated_string" ||
					parent.kind() === "subscript"
				) {
					const parentIdentifier = yield* handleExpression({
						node: parent,
						url,
						parent_id,
						i: i - 1,
					});
					const { refs: propIdentifierRefs, edits: propIdentifierEdits } =
						yield* handleExpression({
							node: property_identifier,
							url,
							parent_id,
							i,
						});
					return {
						refs: [],
						edits: [...parentIdentifier.edits, ...propIdentifierEdits],
						children: [
							parentIdentifier.refs?.length > 0 ||
							parentIdentifier.children?.length > 0
								? {
										id: parent_id !== "" ? `${parent_id}.${i}` : `${i}`,
										text: parent.text().trim(),
										range: getCodeRangeFromSgNode(parent),
										filePath: url.fsPath,
										references: parentIdentifier.refs,
										children: parentIdentifier.children,
									}
								: undefined,
							parent_is_call_expression || propIdentifierRefs?.length > 0
								? {
										id: parent_id !== "" ? `${parent_id}.${i + 1}` : `${i + 1}`,
										text: property_identifier.text().trim(),
										range: getCodeRangeFromSgNode(property_identifier),
										filePath: url.fsPath,
										references: propIdentifierRefs,
										children: [],
									}
								: undefined,
						].filter((x) => x !== undefined),
					};
				}

				console.warn(
					`No identifier or attribute found for ${node.text()} at ${url.fsPath}:${node.range().start.line}:${node.range().start.column}`,
				);
				console.error(
					"instead got children",
					node.children().map((x) => x.kind()),
				);
				return yield* Effect.fail(new NoIdentifierOrAttributeFound());
			}
			case "call": {
				// Extract the identifier or attribute that's being called/accessed
				const args = node.children().find((x) => x.kind() === "argument_list");
				//
				if (!args) {
					console.error(
						`No arguments found for ${node.text()} at ${url.fsPath}:${node.range().start.line}:${node.range().start.column}`,
					);
					return {
						children: [],
						refs: [],
						edits: [],
					};
				}

				const argsRefs = yield* Effect.forEach(
					args
						.children()
						.filter((x) => !ignoreKinds.some((kind) => kind === x.kind())),
					(_arg, index) => {
						let arg = _arg;
						if (arg.kind() === "keyword_argument") {
							arg = arg.children()[3];
						}

						return handleExpression({
							node: arg,
							url,
							parent_id:
								parent_id !== ""
									? `${parent_id}.${i}.${index}`
									: `${i}.${index}`,
							i: 0,
							parent_is_call_expression: true,
						}).pipe(
							Effect.map((x) => ({
								...x,
								node: arg,
							})),
						);
					},
					{ concurrency: 5 },
				).pipe(
					Effect.map((x) =>
						x.filter(
							(arg) =>
								arg.node &&
								!ignoreKinds.some((kind) => kind === arg.node.kind()),
						),
					),
				);

				const argNodes = argsRefs.map(
					(arg, index) =>
						({
							id:
								parent_id !== ""
									? `${parent_id}.${i}.${index}`
									: `${i}.${index}`,
							text:
								ignoreKinds.some((kind) => kind === arg.node.kind()) ||
								arg.node.kind() === "identifier" ||
								arg.node.kind() === "attribute"
									? arg.node.text()
									: `<${arg.node.kind()}/>`,
							range: getCodeRangeFromSgNode(arg.node),
							filePath: url.fsPath,
							references: arg.refs,
							children: arg.children,
						}) satisfies CodeBlock,
				);
				const callerIdentifier = node.children()[0];
				const edits = argsRefs
					.filter(
						(x) =>
							x.node.kind() !== "identifier" && x.node.kind() !== "attribute",
					)
					.map((x) => x.node.replace(`<${x.node.kind()}/>`));
				if (callerIdentifier.kind() === "attribute") {
					// this should in theory have 2 children:
					// 1. call_expression: "b()"
					// 2. property_identifier: "c"
					const parentCall = yield* handleExpression({
						node: callerIdentifier,
						url,
						parent_id,
						i: i - 1,
						parent_is_call_expression: true,
					});

					// I want to put the args expressions in the children of the property_identifier
					const n = parentCall.children[parentCall.children.length - 1];
					n.range = combineCodeRanges(n.range, getCodeRangeFromSgNode(args));
					n.text += args.commitEdits([...edits]);

					node.commitEdits([...edits, ...parentCall.edits]).trim();

					return {
						children: [
							...argNodes.filter(
								(x) =>
									x.references?.length > 0 ||
									x.children?.some(
										(y) =>
											(y.references && y.references?.length > 0) ||
											y.children?.length > 0,
									),
							),
							...parentCall.children.filter(
								(x) =>
									(x.references?.length ?? 0) > 0 ||
									(x.children?.length ?? 0) > 0,
							),
						],
						refs: [],
						edits: [...edits, ...parentCall.edits],
					};
				}

				const caller = yield* handleExpression({
					node: callerIdentifier,
					url,
					parent_id,
					i,
					parent_is_call_expression: true,
				});

				const children = argNodes.filter(
					(x) =>
						x.references?.length > 0 ||
						x.children?.some(
							(y) =>
								(y.references && y.references?.length > 0) ||
								y.children?.length > 0,
						),
				);
				if (children.length > 0 || caller.refs.length > 0) {
					children.push({
						id: `${parent_id}.${i}`,
						text: callerIdentifier.text(),
						range: getCodeRangeFromSgNode(callerIdentifier),
						filePath: url.fsPath,
						references: caller.refs,
						children: [],
					});
				}
				return {
					children,
					refs: [],
					edits: [...caller.edits],
				};
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
					(x) => handleExpression({ node: x, url, parent_id, i }),
					{ concurrency: 5 },
				);
				return x.reduce(
					(acc, curr) => {
						return {
							children: [...acc.children, ...curr.children],
							refs: [...acc.refs, ...curr.refs],
							edits: [...acc.edits, ...curr.edits],
						};
					},
					{ children: [], refs: [], edits: [] },
				);
			}

			case "yield": {
				// For yield expressions, skip the 'yield' keyword (first child)
				// and only process the yielded value(s)
				const children = yield* Effect.forEach(
					node.children().slice(1),
					(x) => handleExpression({ node: x, url, parent_id, i }),
					{ concurrency: 5 },
				);
				return children.reduce(
					(acc, curr) => {
						return {
							children: [...acc.children, ...curr.children],
							refs: [...acc.refs, ...curr.refs],
							edits: [...acc.edits, ...curr.edits],
						};
					},
					{ children: [], refs: [], edits: [] },
				);
			}
		}

		console.error("unhandled node kind", node.kind());

		return {
			children: [],
			refs: [],
			edits: [],
		};
	}).pipe(
		Effect.tap((x) => {
			// console.log("handled node kind", node.kind(), node.text(), x);
		}),
	);
}
