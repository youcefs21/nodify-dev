// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { analyzePythonAST, getPythonExtension } from "./pythonServer";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	// Check for Python extension
	const python = await getPythonExtension();
	if (!python) {
		vscode.window.showWarningMessage(
			"Please install the Python extension for full functionality.",
		);
	}

	// Register the AST analysis command
	const analyzeCommand = vscode.commands.registerCommand(
		"nodify.analyzePythonAST",
		async () => {
			const editor = vscode.window.activeTextEditor;
			if (editor && editor.document.languageId === "python") {
				await analyzePythonAST(editor.document);
			} else {
				vscode.window.showErrorMessage("Please open a Python file first");
			}
		},
	);

	context.subscriptions.push(analyzeCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {
	// Nothing to clean up
}
