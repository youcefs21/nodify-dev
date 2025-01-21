// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { analyzePythonAST } from "./pythonServer";
import type {
	ClientToServerEvents,
	ServerToClientEvents,
} from "@nodify/schema";

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

export function createWebview(
	context: vscode.ExtensionContext,
	onClientMessage: (
		message: ClientToServerEvents,
		postMessage: (message: ServerToClientEvents) => void,
		panel: vscode.WebviewPanel,
	) => void,
) {
	const panel = vscode.window.createWebviewPanel(
		"nodifyWebview",
		"Nodify",
		vscode.ViewColumn.One,
		{
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.joinPath(context.extensionUri, "webview-ui/dist"),
			],
		},
	);

	// Get path to resource on disk
	const reactDistPath = vscode.Uri.joinPath(
		context.extensionUri,
		"webview-ui/dist",
	);

	// And get the special URI to use with the webview
	const webviewUri = panel.webview.asWebviewUri(reactDistPath);

	panel.webview.html = `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Nodify</title>
				<script type="module" crossorigin src="${webviewUri}/assets/index.js"></script>
				<link rel="stylesheet" href="${webviewUri}/assets/index.css">
			</head>
			<body>
				<div id="root"></div>
			</body>
			</html>`;

	// Handle messages from the webview
	panel.webview.onDidReceiveMessage(
		async (message) => {
			onClientMessage(message, panel.webview.postMessage, panel);
		},
		undefined,
		context.subscriptions,
	);
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
			const editor = vscode.window.activeTextEditor;
			if (editor && editor.document.languageId === "python") {
				await analyzePythonAST(editor.document);
			} else {
				vscode.window.showErrorMessage("Please open a Python file first");
			}
		},
	);

	// !! anthony !!
	// TODO: webview should also open using [CodeLens](https://code.visualstudio.com/api/references/vscode-api#CodeLens)

	// Register webview command
	const webviewCommand = vscode.commands.registerCommand(
		"nodify.openWebview",
		async () => {
			createWebview(context, async (message, postMessage, panel) => {
				switch (message.type) {
					// sent when the webview is loaded
					case "hello": {
						vscode.window.showInformationMessage(message.value);
						// Send a message back to the webview
						const editor = vscode.window.activeTextEditor;
						if (editor && editor.document.languageId === "python") {
							const flows = await analyzePythonAST(editor.document);
							postMessage({
								type: "flows",
								value: flows ?? [],
							});
						} else {
							vscode.window.showErrorMessage("Please open a Python file first");
						}
						return;
					}
				}
			});
		},
	);

	context.subscriptions.push(analyzeCommand, webviewCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {
	// Nothing to clean up
}
