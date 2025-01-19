import * as vscode from "vscode";
import { getDefinition, getSymbols } from "./vsc-commands/builtin";
import { getAST, type CodeBlock } from "./ast/flow";
import { type inputItem, type inputList, runLLM } from "./llm";
import fs from "node:fs";

interface SymbolInfo {
	name: string;
	kind: vscode.SymbolKind;
	range: vscode.Range;
	definitions: vscode.Location[];
	references: vscode.Location[];
}

function cleanAST(ast: CodeBlock[]): inputItem[] {
	// remove all children from the ast
	return ast.map((x) => ({
		id: x.id,
		text: x.text,
		children: cleanAST(x.children ?? []),
	}));
}

export async function analyzePythonAST(document: vscode.TextDocument) {
	const ast = await getAST(document);
	const input: inputList = {
		input: cleanAST(ast),
	};
	const output = await runLLM(input);
	console.log("ast: ", ast);
	// save the flows to a file
	const filePath = `${vscode.workspace.workspaceFolders?.[0]?.uri.fsPath}/flows.json`;
	console.log("saving flows to file: ", filePath);
	fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
	try {
		// Get document symbols as a tree-like structure
		// this basically gets the names of all things defined like functions, classes, etc.
		// children are symbols defined inside the scope of the parent symbol
		const symbols = await getSymbols(document.uri);

		// Get imports (already analyzed in findImports)

		// Create a tree-like structure that resembles an AST
		const ast = {
			type: "Module",
			path: document.uri.fsPath,
			symbols: symbols || [],
			definitions: [] as SymbolInfo[],
		};

		//

		// Get all symbol locations
		for (const symbol of symbols || []) {
			try {
				// Get definitions for each symbol
				const definitions = await getDefinition(
					document.uri,
					symbol.range.start,
				);

				// Get references for each symbol
				const references = await vscode.commands.executeCommand<
					vscode.Location[]
				>("vscode.executeReferenceProvider", document.uri, symbol.range.start);

				ast.definitions.push({
					name: symbol.name,
					kind: symbol.kind,
					range: symbol.range,
					definitions: definitions || [],
					references: references || [],
				});
			} catch (e) {
				console.warn(
					`Failed to get definitions/references for symbol ${symbol.name}:`,
					e,
				);
			}
		}

		// Create a new output channel to display AST
		const channel = vscode.window.createOutputChannel("Python AST Analysis");
		channel.show();
		channel.appendLine(JSON.stringify(ast, null, 2));

		// Also show a tree view of symbols
		await vscode.commands.executeCommand("outline.focus");
	} catch (error) {
		console.error("Error analyzing Python code:", error);
		vscode.window.showErrorMessage(
			`Failed to analyze Python code: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}
