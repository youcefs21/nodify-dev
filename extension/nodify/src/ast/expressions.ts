import { parse, Lang, type SgNode, type SgRoot } from "@ast-grep/napi";
import type { CodeBlock, Reference } from "./flow";
import * as vscode from "vscode";
import { getDefinition } from "../vsc-commands/builtin";
import { findNodeFromRange } from "../vsc-commands/analyze-document";
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
let counter = 0;
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
			const reference: Reference = {
				symbol: identifier.text(),
				file: document.uri,
				location: definitions[0],
			};
			if (node.kind() === "call" && counter === 0) {
				counter++;
				extractCodeBlock(reference, 1);
			}
			return [reference];
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

export async function extractCodeBlock(
	reference: Reference,
	id: number,
): Promise<CodeBlock> {
	const document = await vscode.workspace.openTextDocument(reference.file);
	const text = document.getText();

	// Split the file into lines for easier processing
	const lines = text.split(/\r?\n/);

	// Get the starting line of the symbol from the reference's location
	const startLine = reference.location.range.start.line;

	// Extract the name of the symbol to search for
	const symbolName = reference.symbol;

	// Initialize variables to locate the code block
	let startIndex = -1;
	let endIndex = -1;
	let indentLevel = -1;

	// Find the definition line of the symbol
	for (let i = startLine; i < lines.length; i++) {
		const line = lines[i];
		if (
			line.trim().startsWith(`def ${symbolName}(`) ||
			line.trim().startsWith(`class ${symbolName}`)
		) {
			startIndex = i;
			indentLevel = line.search(/\S|$/); // Determine the indentation level
			break;
		}
	}

	if (startIndex === -1) {
		throw new Error(`Symbol '${symbolName}' not found in the file.`);
	}

	// Find the end of the code block based on indentation
	for (let i = startIndex + 1; i < lines.length; i++) {
		const line = lines[i];
		const currentIndent = line.search(/\S|$/);
		if (line.trim() === "" || currentIndent > indentLevel) {
			continue;
		}
		if (currentIndent <= indentLevel && line.trim() !== "") {
			endIndex = i - 1;
			break;
		}
	}

	// If endIndex is still -1, it means the block goes till the end of the file
	if (endIndex === -1) {
		endIndex = lines.length - 1;
	}

	// Extract the code block
	const codeLines = lines.slice(startIndex, endIndex + 1);
	const codeText = codeLines.join("\n");

	// Create the range for the code block
	const range = new vscode.Range(
		new vscode.Position(startIndex, 0),
		new vscode.Position(endIndex, lines[endIndex].length),
	);

	// Return the CodeBlock
	return {
		id: id, // Unique ID for the code block
		text: codeText,
		location: range,
		file: reference.file,
	};
}
