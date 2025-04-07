import * as vscode from "vscode";

/**
 * Get symbols for a given URI. Symbols are the names of the variables, functions, classes, etc.
 * @param url The URI of the text document.
 * @returns A promise that resolves to an array of SymbolInformation and DocumentSymbol instances.
 */
export async function getSymbols(url: vscode.Uri) {
	return await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
		"vscode.executeDocumentSymbolProvider",
		url,
	);
}

/**
 * Get definitions for a given URI and position.
 * @param uri - Uri of a text document.
 * @param position - A position in a text document. You can make a position object with `new vscode.Position(line, character)`
 * @returns A promise that resolves to an array of Location or LocationLink instances.
 */
export async function getDefinition(
	uri: vscode.Uri,
	position: vscode.Position,
) {
	return await vscode.commands.executeCommand<vscode.Location[]>(
		"vscode.executeDefinitionProvider",
		uri,
		position,
	);
}

/**
 * Get references for a given URI and position.
 * @param uri - Uri of a text document.
 * @param position - A position in a text document. You can make a position object with `new vscode.Position(line, character)`
 * @returns A promise that resolves to an array of Location instances.
 */
export async function getReferences(
	uri: vscode.Uri,
	position: vscode.Position,
) {
	return await vscode.commands.executeCommand<vscode.Location[]>(
		"vscode.executeReferenceProvider",
		uri,
		position,
	);
}

/**
 * Provide semantic tokens legend for a document.
 * @param uri - Uri of a text document.
 * @returns A promise that resolves to SemanticTokensLegend.
 */
export async function provideDocumentSemanticTokensLegend(uri: vscode.Uri) {
	return await vscode.commands.executeCommand<vscode.SemanticTokensLegend>(
		"vscode.provideDocumentSemanticTokensLegend",
		uri,
	);
}

/**
 * Provide semantic tokens for a document.
 * @param uri - Uri of a text document.
 * @returns A promise that resolves to SemanticTokens.
 */
export async function provideDocumentSemanticTokens(uri: vscode.Uri) {
	return await vscode.commands.executeCommand<vscode.SemanticTokens>(
		"vscode.provideDocumentSemanticTokens",
		uri,
	);
}
