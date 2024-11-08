import { parse, Lang, type SgNode } from "@ast-grep/napi";
import fs from "node:fs";
import {
	type FlowKind,
	flowKinds,
	type DefinitionKind,
	definitionKinds,
} from "./types/ast.schema";
import type { LLMBlock, Reference } from "./types/llm.types";
import { exportJson } from "./utils/exportJson";

const filePath = "PythonQuest/expression_test.py";
const source = fs.readFileSync(filePath, "utf-8");
const ast = parse(Lang.Python, source);
const root = ast.root();

// I need to hold a "scope" array that will keep track of variables, functions, and classes
// currently in scope.

type Scope = {
	name: string;
	node: SgNode;
}[];

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
			console.log("expression_statement children: ", childrenText);

			const children = node.children();
			if (children.length !== 1) {
				throw "InvalidExpressionStatement";
			}
			const ref = handleExpression(children[0], scope);

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

			scope.push({ name: var_name.text(), node: var_value });

			return children;
		}

		case "call": {
			const ref_id = scope.findLastIndex((x) => x.name === node.text());
			return [{ name: node.text(), ref_id: ref_id }];
		}

		case "lambda":
		case "tuple":
		case "set":
		case "list": {
			const children = node
				.children()
				.flatMap((x) => handleExpression(x, scope));
			return children;
		}

		case "dictionary": {
			break;
		}

		case "dictionary_splat": {
			break;
		}

		case "parenthesized_expression": {
			break;
		}

		case "conditional_expression": {
			break;
		}

		case "subscript": {
			break;
		}

		case "set_comprehension":
		case "tuple_comprehension":
		case "list_comprehension": {
			break;
		}
		case "dictionary_comprehension": {
			break;
		}
		case "generator_expression": {
			break;
		}

		case "binary_operator": {
			break;
		}
		case "pair": {
			break;
		}
		case "unary_operator": {
			break;
		}
		case "for_in_clause": {
			break;
		}

		default: {
			throw new Error(`Unknown Expression Type: ${node.kind()}`);
		}
	}
}

function handleFlows(nodes: SgNode[]): LLMBlock[] {
	const scope: Scope = [];

	const output: LLMBlock[] = [];
	for (let i = 0; i < nodes.length; i++) {
		const kind = nodes[i].kind();
		if (definitionKinds.includes(kind as DefinitionKind)) {
			scope.push({ name: nodes[i].text(), node: nodes[i] });
		} else if (flowKinds.includes(kind as FlowKind)) {
			output.push(handleFlow(nodes[i], kind as FlowKind, i, scope));
		}
	}

	return output;
}

const rootOut = handleFlows(root.children());
await exportJson("quest", rootOut);
