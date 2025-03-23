import * as vscode from "vscode";
import { getOpenAIClientFromWorkspaceConfig } from "../../ast/llm";

/**
 * Register command to select LLM server IP
 * @param context - The extension context
 * @returns command to config server ip
 */
export function registerLLMServerIPSelection(context: vscode.ExtensionContext) {
	return vscode.commands.registerCommand(
		"nodify.selectLLMServerIP",
		async () => {
			const choices = ["http://127.0.0.1:11434", "https://api.openai.com"];
			const configuration = vscode.workspace.getConfiguration("nodify");

			const selection: string = await new Promise((resolve, reject) => {
				// Use this format instead of showQuickPick to allow for user input with onDidChangeValue
				// https://stackoverflow.com/questions/48150745/allow-new-value-on-quickpick-in-a-vscode-extension
				const quickPick = vscode.window.createQuickPick();
				quickPick.items = choices.map((label) => ({ label }));
				quickPick.title = "Enter the LLM Server IP";
				quickPick.onDidChangeValue(() => {
					if (!choices.includes(quickPick.value))
						quickPick.items = [quickPick.value, ...choices].map((label) => ({
							label,
						}));
				});

				quickPick.onDidAccept(() => {
					const selection = quickPick.activeItems[0];
					resolve(selection.label);
					quickPick.hide();
				});
				quickPick.show();
			});

			configuration.update("LLMServerIP", selection);
		},
	);
}

/**
 * Register command to select LLM model ID
 * @param context - The extension context
 * @returns command to config model id
 */
export function registerLLMModelIDSelection(context: vscode.ExtensionContext) {
	return vscode.commands.registerCommand(
		"nodify.selectLLMModelID",
		async () => {
			const configuration = vscode.workspace.getConfiguration("nodify");

			const client = getOpenAIClientFromWorkspaceConfig();
			const models = await client.models.list();
			const available_models = models.data.map((model) => model.id);
			console.log(`available_models: ${available_models}`);

			const selection: string = await new Promise((resolve, reject) => {
				const quickPick = vscode.window.createQuickPick();
				quickPick.items = available_models.map((label) => ({ label }));
				quickPick.title = "Enter the LLM Model ID";
				quickPick.onDidChangeValue(() => {
					if (!available_models.includes(quickPick.value))
						quickPick.items = [quickPick.value, ...available_models].map(
							(label) => ({
								label,
							}),
						);
				});

				quickPick.onDidAccept(() => {
					const selection = quickPick.activeItems[0];
					resolve(selection.label);
					quickPick.hide();
				});
				quickPick.show();
			});

			configuration.update("LLMModelID", selection);
		},
	);
}
