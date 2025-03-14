import * as vscode from "vscode";
import { webviewPanelRef } from "./register-webview-command";
import type { OnClientMessageT } from "./client-message-callback";

interface props {
	context: vscode.ExtensionContext;
	onClientMessage: OnClientMessageT;
	oldPanel?: vscode.WebviewPanel;
}

/**
 * Creates a new webview panel
 * @param context The extension context
 * @param onClientMessage Callback function to handle incoming messages from the webview client
 * @returns The created webview panel
 */
export function createWebview({ context, onClientMessage, oldPanel }: props) {
	// 🌱 Create the Webview Panel
	const panel = oldPanel
		? oldPanel
		: vscode.window.createWebviewPanel(
				"nodifyWebview",
				"Nodify",
				vscode.ViewColumn.Beside,
				{
					enableScripts: true,
					retainContextWhenHidden: true,
					localResourceRoots: [
						vscode.Uri.joinPath(context.extensionUri, "webview-ui/dist"),
					],
				},
			);
	webviewPanelRef.current = panel;
	panel.webview.html = rootHtml(panel, context);

	// 📥 Handle incoming messages from the webview
	panel.webview.onDidReceiveMessage(
		(message) => {
			onClientMessage(context, message);
		},
		undefined,
		context.subscriptions,
	);

	// 🗑️ Cleanup - set the singleton panel ref to null
	panel.onDidDispose(
		() => {
			webviewPanelRef.current = null;
		},
		null,
		context.subscriptions,
	);

	return panel;
}

/**
 * Generates the HTML content for the webview
 * @param panel - The webview panel instance
 * @param context - The extension context
 * @returns HTML string for the webview
 */
function rootHtml(
	panel: vscode.WebviewPanel,
	context: vscode.ExtensionContext,
) {
	// get the special URI to use with the webview
	const reactDistPath = vscode.Uri.joinPath(
		context.extensionUri,
		"webview-ui/dist",
	);
	const webviewUri = panel.webview.asWebviewUri(reactDistPath);
	return `<!DOCTYPE html>
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
}
