// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { NodifyCodeLensProvider } from "./providers/codelens";
import { activeHashRef, registerWebview } from "./vsc-commands/webview-command";
import { initDB } from "./db/jsonDB";
import { analyzePythonDocument } from "./vsc-commands/analyze-document";

interface PythonExtensionApi {
	environments: {
		getActiveEnvironmentPath: () => Promise<{ path: string }>;
	};
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
			activeHashRef.current = "";
			const editor = vscode.window.activeTextEditor;
			if (editor && editor.document.languageId === "python") {
				await analyzePythonDocument(editor.document);
			} else {
				vscode.window.showErrorMessage("Please open a Python file first");
			}
		},
	);

	const codeLensProvider = vscode.languages.registerCodeLensProvider(
		"python",
		new NodifyCodeLensProvider(),
	);

	// Note: tried to enable ctrl+shift+alt+click functionality like Go To References, but vscode doesnt allow you to detect whether ctrl is held down.
	// So, hover option it is
	// TODO maybe?
	// const hoverProvider = vscode.languages.registerHoverProvider(
	// 	"python",
	// 	new NodifyHoverProvider(),
	// );

	const webviewCommand = registerWebview(context);

	await initDB();

	context.subscriptions.push(analyzeCommand, webviewCommand, codeLensProvider);
}

// This method is called when your extension is deactivated
export function deactivate() {
	// Nothing to clean up
}
