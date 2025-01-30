import * as vscode from "vscode";
import { analyzePythonAST } from "../pythonServer";
import type {
	ClientToServerEvents,
	ServerToClientEvents,
} from "@nodify/schema";
import {
	AbstractionLevelOneNodeMapper,
	createEdges,
	flattenCustomNodes,
} from "../graph/NodeCreater";

const postMessageToPanel =
	(panel: vscode.WebviewPanel) => (message: ServerToClientEvents) =>
		panel.webview.postMessage(JSON.stringify(message));

const expanded = new Map<string, boolean>([
	["-1", true],
	["-2", true],
]);

async function refreshNodes(panel: vscode.WebviewPanel) {
	const visibleEditors = vscode.window.visibleTextEditors;
	const pythonEditor = visibleEditors.find(
		(editor) => editor.document.languageId === "python",
	);

	if (pythonEditor) {
		const flows = await analyzePythonAST(pythonEditor.document);
		const nodes = flattenCustomNodes(
			AbstractionLevelOneNodeMapper(flows, expanded),
		);
		postMessageToPanel(panel)({
			type: "nodes",
			value: nodes,
		});
		const edges = createEdges(nodes);
		postMessageToPanel(panel)({
			type: "edges",
			value: edges,
		});
	} else {
		vscode.window.showErrorMessage(
			"Please open a Python file in another editor pane",
		);
	}
}

export async function createWebview(
	context: vscode.ExtensionContext,
	onClientMessage: (
		message: ClientToServerEvents,
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
			onClientMessage(message, panel);
		},
		undefined,
		context.subscriptions,
	);
	await refreshNodes(panel);
}

export function registerWebview(context: vscode.ExtensionContext) {
	//
	// Register webview command
	return vscode.commands.registerCommand("nodify.openWebview", async () => {
		await createWebview(context, async (message, panel) => {
			switch (message.type) {
				// sent when the webview is loaded
				// vscode.window.showInformationMessage(message.value);
				case "on-render": {
					await refreshNodes(panel);
					return;
				}

				case "node-toggle": {
					// expand nodeId, and refresh nodes
					expanded.set(message.nodeId, !expanded.get(message.nodeId));
					await refreshNodes(panel);
					return;
				}
			}
		});
	});
}
