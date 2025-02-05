import * as vscode from "vscode";
import { analyzePythonDocument } from "./analyze-document";
import type {
	ClientToServerEvents,
	LLMOutput,
	ServerToClientEvents,
} from "../types";
import {
	AbstractionLevelOneNodeMapper,
	createEdges,
	entryNode,
	flattenCustomNodes,
} from "../graph/NodeCreater";
import { readLLMCache, readLLMCacheFromAST } from "../db/jsonDB";

const postMessageToPanel =
	(panel: vscode.WebviewPanel) => (message: ServerToClientEvents) =>
		panel.webview.postMessage(JSON.stringify(message));

const expanded = new Map<string, boolean>([
	["-1", true],
	["-2", true],
]);

export const activeHashRef = {
	current: "",
};

async function refreshNodes(panel: vscode.WebviewPanel) {
	let flows: LLMOutput[] = [];
	if (activeHashRef.current === "") {
		const visibleEditors = vscode.window.visibleTextEditors;
		const pythonEditor = visibleEditors.find(
			(editor) => editor.document.languageId === "python",
		);
		if (pythonEditor) {
			flows = await analyzePythonDocument(pythonEditor.document);
		} else {
			vscode.window.showErrorMessage(
				"Please open a Python file in another editor pane",
			);
		}
	} else {
		const output = await readLLMCache(activeHashRef.current);
		if (!output) {
			vscode.window.showErrorMessage("invalid llm cache entry");
			return;
		}

		flows = [
			{
				...entryNode,
				children: [
					{
						// biome-ignore lint/style/noNonNullAssertion: entryNode.children is not null
						...entryNode.children![0],
						children: output,
					},
				],
			},
		];
	}

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

	return panel;
}

export function registerWebview(context: vscode.ExtensionContext) {
	//
	// Register webview command
	return vscode.commands.registerCommand("nodify.openWebview", async () => {
		activeHashRef.current = "";
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
