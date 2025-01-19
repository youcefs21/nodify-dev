import * as vscode from "vscode";
import { getDefinition, getSymbols } from "./vsc-commands/builtin";
import { getAST } from "./ast/flow";

interface SymbolInfo {
	name: string;
	kind: vscode.SymbolKind;
	range: vscode.Range;
	definitions: vscode.Location[];
	references: vscode.Location[];
}

interface ImportInfo {
	name: string;
	fromModule?: string;
	alias?: string;
	location: vscode.Location;
	definition?: vscode.Location;
	resolvedSymbols?: vscode.SymbolInformation[];
}

async function findImports(
	document: vscode.TextDocument,
): Promise<ImportInfo[]> {
	const imports: ImportInfo[] = [];
	const text = document.getText();

	// Find all import statements using regex
	const importRegex =
		/^(?:from\s+([\w.]+)\s+)?import\s+((?:[\w.]+(?:\s+as\s+\w+)?(?:\s*,\s*)?)+)/gm;

	for (
		let match = importRegex.exec(text);
		match !== null;
		match = importRegex.exec(text)
	) {
		const fromModule = match[1];
		const importList = match[2].split(",").map((i) => i.trim());

		for (const importItem of importList) {
			const [name, alias] = importItem.split(/\s+as\s+/).map((s) => s.trim());
			const startPos = document.positionAt(match.index);
			const endPos = document.positionAt(match.index + match[0].length);

			// Find the exact position of the imported symbol name in the text
			const fullText = match[0];
			const nameIndex = fullText.indexOf(name);
			if (nameIndex === -1) {
				continue;
			}

			const symbolPos = document.positionAt(match.index + nameIndex);

			// Try to find the actual definition of the imported symbol
			let definition: vscode.Location | undefined;
			try {
				// If it's a from import, we need to look up the full path
				const lookupName = fromModule ? `${fromModule}.${name}` : name;

				// First try to get definition at the symbol position
				const definitions = await vscode.commands.executeCommand<
					vscode.Location[]
				>("vscode.executeDefinitionProvider", document.uri, symbolPos);

				if (!definitions?.length) {
					// If that fails, try to find it in workspace symbols
					const workspaceSymbols = await vscode.commands.executeCommand<
						vscode.SymbolInformation[]
					>("vscode.executeWorkspaceSymbolProvider", lookupName);

					// Filter to exact matches only
					const exactMatches = workspaceSymbols?.filter(
						(s) =>
							s.name === name ||
							s.name === lookupName ||
							s.name.endsWith(`.${name}`),
					);

					if (exactMatches?.length) {
						definition = exactMatches[0].location;
					}
				} else {
					definition = definitions[0];
				}
			} catch (e) {
				console.warn(`Failed to get definition for import ${name}:`, e);
			}

			imports.push({
				name,
				fromModule,
				alias,
				location: new vscode.Location(
					document.uri,
					new vscode.Range(startPos, endPos),
				),
				definition,
			});
		}
	}

	return imports;
}

export async function analyzePythonAST(document: vscode.TextDocument) {
	const ast = await getAST(document);
	console.log("ast: ", ast);
	try {
		// Get document symbols as a tree-like structure
		// this basically gets the names of all things defined like functions, classes, etc.
		// children are symbols defined inside the scope of the parent symbol
		const symbols = await getSymbols(document.uri);

		// Get imports (already analyzed in findImports)
		const imports = await findImports(document);

		// Create a tree-like structure that resembles an AST
		const ast = {
			type: "Module",
			path: document.uri.fsPath,
			imports,
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
