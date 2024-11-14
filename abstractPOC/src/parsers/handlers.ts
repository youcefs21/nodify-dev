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
import { exportJson } from "../utils/exportJson";

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

type ScopeItem = {
	name: string;
	node: SgNode | SgRoot | ScopeItem | null;
	kind: "function" | "class" | "variable" | "module" | "alias";
};
type Scope = ScopeItem[];

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

function handleImportFile(module_name: string): SgRoot | null {
	const file_path = module_name.replaceAll(".", "/");

	if (!fs.existsSync(file_path)) return null;
	return parse(Lang.Python, fs.readFileSync(file_path, "utf-8"));
}

function handleImport(node: SgNode, kind: ImportKind, scope: Scope): void {
	switch (kind) {
		case "import_statement": {
			// console.log(node);
			const import_names = node
				.children()
				.filter((x) => x.text() !== "import")
				.filter((x) => x.text() !== ",")
				.map((x) => x.text());

			// console.log("import statement children: ", import_names);
			// if (import_names.includes("*")) {
			// 	// TODO dont throw err here, just stop the traversal
			// 	throw new Error("Wildcard imports are not supported");
			// }
			for (const name of import_names) {
				const actual_name = name.split("as")[0];
				//TODO handle file path with actual node or null
				// TODO check that the path exists (if not, skip), else place root node as node
				const file_path = handleImportFile(actual_name);

				const actual_scope_item: ScopeItem = {
					name: actual_name,
					node: file_path,
					kind: "module",
				};
				if (name.includes("as")) {
					const display_name = name.split("as")[1];
					scope.push({
						name: display_name,
						kind: "alias",
						node: actual_scope_item,
					});
				} else {
					scope.push(actual_scope_item);
				}
			}

			break;
		}
		case "import_from_statement": {
			const import_names = node
				.children()
				.filter((x) => x.text() !== "from")
				.filter((x) => x.text() !== "import")
				.filter((x) => x.text() !== ",")
				.map((x) => x.text());
			// console.log("import from statement: ", import_names);
			// if (import_names.includes("*")) {
			// 	throw new Error("Wildcard imports are not supported");
			// }
			// TODO check that the path exists (if not, skip), else
			// run handleFlows on the root node of the file,
			// extract the scope, and return the most recently defined node matching the function name
			const module_name = import_names[0];
			const file_path = handleImportFile(module_name);
			const module_scope_item: ScopeItem = {
				name: module_name,
				node: file_path,
				kind: "module",
			};
			for (const name of import_names.slice(1)) {
				const actual_name = name.split("as")[0];
				//TODO handle file path with actual node or null
				// TODO check that the path exists (if not, skip), else place root node as node
				const actual_scope_item: ScopeItem = {
					name: actual_name,
					kind: "function", //Func for now, could be class/var but doesnt really matter
					node: module_scope_item,
				};
				if (name.includes("as")) {
					const display_name = name.split("as")[1];
					scope.push({
						name: display_name,
						kind: "alias",
						node: actual_scope_item,
					});
				} else {
					scope.push(actual_scope_item);
				}
			}
			break;
		}
		case "future_import_statement": {
			throw new Error("future imports not supported (for now)");
			//TODO handle after PoC
			// break;
		}
		default: {
			throw new Error(`Unknown Import Type: ${kind}`);
		}
	}
	// console.log(scope);
}

function handleFlows(nodes: SgNode[]): LLMBlock[] {
	const scope: Scope = [];

	const output: LLMBlock[] = [];
	for (let i = 0; i < nodes.length; i++) {
		const kind = nodes[i].kind();
		if (definitionKinds.includes(kind as DefinitionKind)) {
			scope.push({
				name: nodes[i]
					.children()
					.find((x) => x.kind() === "identifier")
					?.text(),
				node: nodes[i],
				kind: nodes[i].kind() === "class_definition" ? "class" : "function",
			});
		} else if (importKinds.includes(kind as ImportKind)) {
			handleImport(nodes[i], kind as ImportKind, scope);
		} else if (flowKinds.includes(kind as FlowKind)) {
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

export {
	handleFlows,
	handleImportFile,
	handleImport,
	handleFlow,
	handleExpression,
	handleFile,
};

// const rootOut = handleFlows(root.children());
// await exportJson("quest", rootOut);
