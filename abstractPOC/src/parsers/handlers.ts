import { parse, Lang, type SgNode, type SgRoot } from "@ast-grep/napi";
import fs from "node:fs";
import {
	type FlowKind,
	flowKinds,
	type DefinitionKind,
	definitionKinds,
	type ImportKind,
	importKinds,
} from "../types/ast.schema";
import type { LLMBlock, Reference } from "../types/llm.types";
import { handleImport } from "./import.handler";

// const filePath = "PythonQuest/expression_test.py";
// const source = fs.readFileSync(filePath, "utf-8");
// const ast = parse(Lang.Python, source);
// const root = ast.root();

// I need to hold a "scope" array that will keep track of variables, functions, and classes
// currently in scope.

// type Scope = {
// 	name: string;
// 	node: SgNode | string; // include string as a file path for import locations, for now
// }[];

export type ScopeItem =
	| {
			name: string;
			node: SgNode | null;
			kind: "function" | "class" | "variable";
	  }
	| {
			name: string;
			node: SgRoot | null;
			kind: "module";
	  }
	| {
			name: string;
			node: ScopeItem;
			kind: "alias" | "function";
	  };

export type Scope = ScopeItem[];

function handleFlow(
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

function handleExpression(node: SgNode, scope: Scope): Reference[] {
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
				return { name: x.text(), node: x, kind: "variable" } as ScopeItem;
			});
			scope = scope.concat(children);
			break;
		}

		case "attribute":
		case "call": {
			const ref_id = scope.findLastIndex(
				(x) =>
					x.name ===
					node
						.children()
						.find((y) => y.kind() === "identifier")
						?.text(),
			);
			return [{ name: node.text(), ref_id: ref_id }];
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

function handleFlows(nodes: SgNode[]): LLMBlock[] {
	const scope: Scope = [];
	const output: LLMBlock[] = [];

	for (let i = 0; i < nodes.length; i++) {
		const kind = nodes[i].kind();

		// handle definitions
		if (definitionKinds.some((defKinds) => defKinds === kind)) {
			const identifier = nodes[i]
				.children()
				.find((x) => x.kind() === "identifier");

			if (!identifier) {
				throw new Error(`No identifier found for ${nodes[i].kind()}`);
			}

			scope.push({
				name: identifier.text(),
				node: nodes[i],
				kind: nodes[i].kind() === "class_definition" ? "class" : "function",
			});
			continue;
		}

		// handle imports
		if (importKinds.some((impKinds) => impKinds === kind)) {
			handleImport(nodes[i], kind as ImportKind, scope);
			continue;
		}

		// handle flows
		if (flowKinds.some((flowKinds) => flowKinds === kind)) {
			output.push(handleFlow(nodes[i], kind as FlowKind, i, scope));
		}
	}

	return output;
}

function handleFile(filePath: string): LLMBlock[] {
	const source = fs.readFileSync(filePath, "utf-8");
	const ast = parse(Lang.Python, source);
	const root = ast.root();
	return handleFlows(root.children());
}

export { handleFlows, handleImport, handleFlow, handleExpression, handleFile };
