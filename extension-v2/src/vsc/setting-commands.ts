import * as vscode from "vscode";
import exec from "node:child_process";
import { resolve } from "node:path";

/**
 * Register LLM config commands
 * @param context - The extension context
 * @returns commands to config server ip and model id
 */
export async function registerLLMSelection(context: vscode.ExtensionContext) {
	// If running a model locally, list available models (otherwise just error out
	// of this block and provide no options later on)
	const available_models: string[] = await new Promise((resolve, reject) => {
		exec.exec("ollama list", (error, stdout, stderr) => {
			if (error) {
				console.error(
					`Failed to execute local command (non-critical): ${error}`,
				);
				reject(`Failed to execute local command (non-critical): ${error}`);
				return;
			}

			if (stderr) {
				console.error(
					`Local command execution returned (non-critical): ${stderr}`,
				);
				reject(`Local command execution returned (non-critical): ${stderr}`);
				return;
			}

			const available_models_with_details = stdout.split("\n").slice(1);
			const available_models = available_models_with_details.map(
				(model) => model.split(" ")[0],
			);
			resolve(
				available_models
					.map((model) => model.trim())
					.filter((model) => model !== ""),
			);
		});
	});
	console.log(`available_models: ${available_models}`);

	const commands = [
		// Open dialogue boxes to change the server ip and model id
		vscode.commands.registerCommand("nodify.selectLLMServerIP", async () => {
			const choices = ["http://127.0.0.1:11434"];
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
		}),
		vscode.commands.registerCommand("nodify.selectLLMModelID", async () => {
			const configuration = vscode.workspace.getConfiguration("nodify");

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
		}),
	];

	return commands;
}
