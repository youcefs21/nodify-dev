import type * as vscode from "vscode";
import { createWebview } from "./create-webview";
import { onClientMessage } from "./webview-message-callback";
export class NodifyWebviewSerializer implements vscode.WebviewPanelSerializer {
	constructor(private readonly context: vscode.ExtensionContext) {}

	async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel) {
		createWebview({
			context: this.context,
			onClientMessage,
			oldPanel: webviewPanel,
		});
	}
}
