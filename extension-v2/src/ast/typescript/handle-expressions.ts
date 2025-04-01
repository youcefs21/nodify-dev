import * as vscode from "vscode";
import { type Edit, Lang, type SgNode } from "@ast-grep/napi";
import { Effect } from "effect";
import { ignoreKinds } from "./ast.schema";
import type { CodeBlock, CodeReference } from "../llm/llm.schema";
import { getDefinition } from "../../vsc/builtin";
import type { UnknownException } from "effect/Cause";
import {
	getIdentifierBody,
	type NoParentBodyRangeFound,
} from "../get-definition";
import {
	combineCodeRanges,
	getCodeRangeFromSgNode,
} from "../../utils/get-range";

class NoIdentifierOrAttributeFound {
	readonly _tag = "NoIdentifierOrAttributeFound";
	readonly message = "No identifier or attribute found";
}

class NoArgumentsFound {
	readonly _tag = "NoArgumentsFound";
	readonly message = "No arguments found";
}

class NoStatementBlockFound {
	readonly _tag = "NoStatementBlockFound";
	readonly message = "No statement block found";
}

export type HandleExpressionErrors =
	| UnknownException
	| NoParentBodyRangeFound
	| NoIdentifierOrAttributeFound
	| NoArgumentsFound
	| NoStatementBlockFound;
interface Props {
	node: SgNode;
	url: vscode.Uri;
	parent_id: string;
	parent_is_call_expression?: boolean;
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
	edits: Edit[];
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
	parent_is_call_expression,
}: Props): Effect.Effect<Output, HandleExpressionErrors> {
	// Skip processing for basic syntax elements that don't contain meaningful references
	if (ignoreKinds.some((kind) => kind === node.kind())) {
		return Effect.succeed({
			children: [],
			refs: [],
			edits: [],
		});
	}

	if (
		i === 0 &&
		(node.kind() === "call_expression" || node.kind() === "member_expression")
	) {
		// I need to precompute the depth of the chained calls, and set i to that depth
		let current = node;
		let depth = 0;
		while (
			current.kind() === "call_expression" ||
			current.kind() === "member_expression"
		) {
			depth++;
			current = current.children()[0];
		}
		i = depth;
	}

	return Effect.gen(function* () {
		switch (node.kind()) {
			case "generator_function":
			case "function_declaration":
			case "arrow_function": {
				// I just need to create a ref to this place
				const body = yield* getIdentifierBody(
					{
						targetRange: new vscode.Range(
							new vscode.Position(
								node.range().start.line,
								node.range().start.column,
							),
							new vscode.Position(
								node.range().end.line,
								node.range().end.column,
							),
						),
						targetUri: url,
					} as vscode.LocationLink,
					Lang.TypeScript,
				);
				if (!body) {
					return {
						children: [],
						refs: [],
						edits: [],
					};
				}
				return {
					children: [],
					refs: [
						{
							symbol: `<${node.kind()}_${body.shortId}/>`,
							id: body.shortId,
							fullHash: body.fullHash,
							body: body.text,
							range: body.range,
							filePath: body.uri.fsPath,
							lang: Lang.TypeScript,
						},
					],
					edits: [node.replace(`<${node.kind()}_${body.shortId}/>`)],
				};
			}
			case "new_expression":
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
				const offset = node.kind() === "new_expression" ? 1 : 0;

				// process the args expressions
				const args = node.children()[1 + offset];
				if (args.kind() !== "arguments") {
					console.warn(
						`Expected arguments for call_expression ${node.text()} at ${url.fsPath}:${node.range().start.line}:${node.range().start.column}`,
					);
					return yield* Effect.fail(new NoArgumentsFound());
				}

				const argsRefs = yield* Effect.forEach(
					args.children(),
					(arg, index) =>
						handleExpression({
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
						),
					{ concurrency: 5 },
				).pipe(
					Effect.map((x) =>
						x.filter(
							(arg) => !ignoreKinds.some((kind) => kind === arg.node.kind()),
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
							text: ignoreKinds.some((kind) => kind === arg.node.kind())
								? arg.node.text()
								: `<${arg.node.kind()}/>`,
							range: getCodeRangeFromSgNode(arg.node),
							filePath: url.fsPath,
							references: arg.refs,
							children: arg.children,
						}) satisfies CodeBlock,
				);

				const edits = argsRefs.map((x) =>
					x.node.replace(`<${x.node.kind()}/>`),
				);

				const callerIdentifier = node.children()[0 + offset];
				if (callerIdentifier.kind() === "member_expression") {
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
					n.children?.push(...argNodes);
					n.range = combineCodeRanges(n.range, getCodeRangeFromSgNode(args));
					n.text += args.commitEdits([...edits]);

					node.commitEdits([...edits, ...parentCall.edits]).trim();

					return {
						...parentCall,
						edits: [...edits, ...parentCall.edits],
					};
				}

				const { refs: callerIdentifierRefs, edits: callerIdentifierEdits } =
					yield* handleExpression({
						node: callerIdentifier,
						url,
						parent_id,
						i,
						parent_is_call_expression: true,
					});

				return {
					children: argNodes,
					refs: callerIdentifierRefs,
					edits: [...edits, ...callerIdentifierEdits],
				};
			}

			case "member_expression": {
				const parent = node.children()[0];
				const property_identifier = node.children()[2];
				// the parent could either be a call_expression or a member_expression

				if (node.text() === "context.subscriptions") {
					console.log(node.range());
				}

				// "a().c" (parent is call_expression "a()")
				if (parent.kind() === "call_expression") {
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
					parent.kind() === "member_expression" ||
					parent.kind() === "subscript_expression"
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
						edits: [],
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
					edits: [],
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
			// case "subscript_expression":
			case "unary_expression":
			case "assignment_expression":
			case "await_expression":
			case "yield_expression":
			case "return_statement":
			case "lexical_declaration":
			case "variable_declarator": {
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
		}

		return {
			children: [],
			refs: [],
			edits: [],
		};
	});
}
