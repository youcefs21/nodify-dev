import * as vscode from "vscode";
import { analyzePythonAST } from "../pythonServer";
import type {
	ClientToServerEvents,
	ServerToClientEvents,
} from "@nodify/schema";
import {
	AbstractionLevelOneNodeMapper,
	flattenCustomNodes,
} from "../graph/NodeCreater";

export async function createWebview(
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
		vscode.ViewColumn.Beside,
		{
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.joinPath(context.extensionUri, "webview-ui/dist"),
			],
		},
	);
	const postMessage = (message: ServerToClientEvents) =>
		panel.webview.postMessage(JSON.stringify(message));

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
			onClientMessage(message, postMessage, panel);
		},
		undefined,
		context.subscriptions,
	);

	const visibleEditors = vscode.window.visibleTextEditors;
	const pythonEditor = visibleEditors.find(
		(editor) => editor.document.languageId === "python",
	);

	if (pythonEditor) {
		const flows = await analyzePythonAST(pythonEditor.document);
		const expanded = new Map<string, boolean>([
			["-1", true],
			["-2", true],
		]);
		const nodes = flattenCustomNodes(
			AbstractionLevelOneNodeMapper(flows, expanded),
		);
		postMessage({
			type: "nodes",
			value: nodes,
		});
	} else {
		vscode.window.showErrorMessage(
			"Please open a Python file in another editor pane",
		);
	}
}

export function registerWebview(context: vscode.ExtensionContext) {
	//
	// Register webview command
	return vscode.commands.registerCommand("nodify.openWebview", async () => {
		await createWebview(context, async (message, postMessage) => {
			switch (message.type) {
				// sent when the webview is loaded
				case "hello": {
					vscode.window.showInformationMessage(message.value);
					// Find Python file in visible editors
					return;
				}
			}
		});
	});
}
