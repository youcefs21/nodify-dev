import * as vscode from "vscode";

export function getNodifyWorkspaceDir() {
	const workspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
	if (!workspace) {
		vscode.window.showErrorMessage("failed to get workspace folder");
	}

	return `${workspace}/.nodify`;
}
