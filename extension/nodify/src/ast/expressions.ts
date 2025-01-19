import type { SgNode } from "@ast-grep/napi";
import type { Reference } from "./flow";
import * as vscode from "vscode";
import { getDefinition } from "../vsc-commands/builtin";

const ignoreKinds = [
	"=",
	"identifier",
	"integer",
	"[",
	"]",
	"(",
	")",
	",",
	"lambda",
	":",
	"lambda_parameters",
	"{",
	"}",
	"if",
	"else",
	"or",
	"not",
	"and",
	"==",
	"!=",
	"<",
	">",
	"<=",
	">=",
	"in",
	"not in",
	"is",
	"is not",
	"|",
	"^",
	"&",
	"<<",
	">>",
	"+",
	"-",
	"*",
	"/",
	"//",
	"%",
	"**",
	"true",
	"false",
	"await",
	"ellipsis",
	"string_content",
	"string_start",
	"string_end",
	"for",
	"in",
	"int",
	"float",
	"+=",
	"-=",
	"*=",
	"/=",
	"//=",
	"%=",
	"**=",
	"&=",
	"|=",
	"^=",

	// maybe, check again later
	"pattern_list",
];

export async function handleExpression(
	node: SgNode,
	document: vscode.TextDocument,
): Promise<Reference[]> {
	if (ignoreKinds.some((kind) => kind === node.kind())) {
		return [];
	}
	switch (node.kind()) {
		case "attribute":
		case "call": {
			const identifier = node
				.children()
				.find((x) => x.kind() === "identifier" || x.kind() === "attribute");
			if (!identifier) {
				console.error(
					"No identifier or attribute found for call",
					node.children().map((x) => ({
						kind: x.kind(),
						text: x.text(),
						children: x.children().map((y) => ({
							kind: y.kind(),
							text: y.text(),
						})),
					})),
				);
				throw new Error("No identifier or attribute found for call");
			}
			const location = identifier.range().start;

			const definitions = await getDefinition(
				document.uri,
				new vscode.Position(location.line, location.column),
			);

			// const ref_id = scope.findLastIndex((x) => x.name === identifier.text());
			// if (ref_id === -1) {
			// 	return [];
			// }
			return [
				{
					symbol: identifier.text(),
					file: document.uri,
					location: definitions[0],
				},
			];
		}

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
			const x = await Promise.all(
				node.children().flatMap((x) => handleExpression(x, document)),
			);
			return x.flat();
		}

		case "yield": {
			const children = await Promise.all(
				node
					.children()
					.slice(1)
					.flatMap((x) => handleExpression(x, document)),
			);
			return children.flat();
		}
	}
	// throw new Error(
	// 	`Unknown Expression Type (no switch statements activated): ${node.kind()}`,
	// );
	return [];
}
