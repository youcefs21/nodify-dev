import * as vscode from "vscode";
import { postMessageToPanel } from "../webview/register-webview-command";

export function registerCursorPositionListener() {
	return vscode.window.onDidChangeTextEditorSelection(async (e) => {
		const { active } = e.selections[0];
		const position = {
			line: active.line,
			character: active.character,
		};
		await postMessageToPanel({
			type: "cursor-position",
			value: position,
		});
	});
}
