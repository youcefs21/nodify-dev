import type { SgNode } from "@ast-grep/napi";
import type { Reference } from "../types/llm.types";
import type { Scope, ScopeItem } from "../types/graph.types";

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
];

export function handleExpression(node: SgNode, scope: Scope): Reference[] {
	if (ignoreKinds.includes(node.kind())) {
		return [];
	}

	switch (node.kind()) {
		case "assignment": {
			const var_name = node.children()[0];
			const var_value = node.children()[2];
			const children = node
				.children()
				.flatMap((x) => handleExpression(x, scope));

			scope.push({ name: var_name.text(), node: var_value, kind: "variable" });

			return children;
		}

		case "pattern_list": {
			const children = node.children().flatMap((x) => {
				// TODO fix bug for a, *b = {} - likely text will include *b here but we just want b
				return {
					name: x.text(),
					node: x,
					kind: "variable",
				} satisfies ScopeItem;
			});
			scope.push(...children);
			break;
		}

		case "attribute":
		case "call": {
			const identifier = node
				.children()
				.find((x) => x.kind() === "identifier" || x.kind() === "attribute");
			// This is what an attribute looks like
			// {
			// 	kind: "attribute",
			// 	text: "turtle.Screen",
			// 	children: [
			// 		{
			// 			kind: "identifier",
			// 			text: "turtle",
			// 		},
			// 		{
			// 			kind: ".",
			// 			text: ".",
			// 		},
			// 		{
			// 			kind: "identifier",
			// 			text: "Screen",
			// 		},
			// 	],
			// };
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

			const ref_id = scope.findLastIndex((x) => x.name === identifier.text());
			if (ref_id === -1) {
				return [];
			}
			return [{ name: identifier.text(), ref_id: ref_id }];
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
		case "unary_operator": {
			const children = node
				.children()
				.flatMap((x) => handleExpression(x, scope));
			return children;
		}

		// case "dictionary_splat": {
		// 	break;
		// }

		case "yield": {
			const children = node
				.children()
				.slice(1)
				.flatMap((x) => handleExpression(x, scope));
			return children;
		}

		default: {
			throw new Error(
				`Unknown Expression Type: ${node.kind()}, ${node.text()}`,
			);
		}
	}
	throw new Error(
		`Unknown Expression Type (no switch statements activated): ${node.kind()}`,
	);
}
