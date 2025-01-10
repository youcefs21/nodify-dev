import * as vscode from "vscode";

interface PythonExtensionApi {
	environments: {
		getActiveEnvironmentPath: () => Promise<{ path: string }>;
	};
}

interface SymbolInfo {
	name: string;
	kind: vscode.SymbolKind;
	range: vscode.Range;
	definitions: vscode.Location[];
	references: vscode.Location[];
}

export async function getPythonExtension(): Promise<
	vscode.Extension<PythonExtensionApi> | undefined
> {
	const extension =
		vscode.extensions.getExtension<PythonExtensionApi>("ms-python.python");
	if (extension) {
		if (!extension.isActive) {
			await extension.activate();
		}
		return extension;
	}
	return undefined;
}

export async function analyzePythonAST(document: vscode.TextDocument) {
	try {
		// Get document symbols as a tree-like structure
		const symbols = await vscode.commands.executeCommand<
			vscode.DocumentSymbol[]
		>("vscode.executeDocumentSymbolProvider", document.uri);

		// Get semantic tokens
		const tokens = await vscode.commands.executeCommand<vscode.SemanticTokens>(
			"vscode.provideDocumentSemanticTokens",
			document.uri,
		);

		// Create a tree-like structure that resembles an AST
		const ast = {
			type: "Module",
			path: document.uri.fsPath,
			symbols: symbols || [],
			semanticTokens: tokens || null,
			definitions: [] as SymbolInfo[],
		};

		// Get all symbol locations
		for (const symbol of symbols || []) {
			try {
				// Get definitions for each symbol
				const definitions = await vscode.commands.executeCommand<
					vscode.Location[]
				>("vscode.executeDefinitionProvider", document.uri, symbol.range.start);

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
