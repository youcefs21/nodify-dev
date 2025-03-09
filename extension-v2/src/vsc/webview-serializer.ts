import type * as vscode from "vscode";
import { createWebview } from "./create-webview";

export class NodifyWebviewSerializer implements vscode.WebviewPanelSerializer {
	constructor(private readonly context: vscode.ExtensionContext) {}

	async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel) {
		createWebview(
			this.context,
			() => {
				// TODO: replace me!
			},
			webviewPanel,
		);
	}
}
