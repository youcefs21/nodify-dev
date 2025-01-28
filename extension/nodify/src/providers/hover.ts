import * as vscode from "vscode";

export class NodifyHoverProvider implements vscode.HoverProvider {
	public provideHover(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken,
	): vscode.ProviderResult<vscode.Hover> {
		return new vscode.Hover("Hello World");
		// const wordRange = document.getWordRangeAtPosition(position, /\w+/);
		// const word = document.getText(wordRange);

		// // If the word is a function name, show a hover message
		// if (word) {
		// 	const hoverMessage = `This is the function: **${word}**`;

		// 	// Returning hover content with a custom command
		// 	const command: vscode.Command = {
		// 		title: "Run custom action for this symbol", // Text that will appear in the hover
		// 		command: "", // The custom command to run
		// 		arguments: [], // Arguments to pass to the command
		// 	};

		// 	return new vscode.Hover(
		// 		{
		// 			language: "python",
		// 			value: hoverMessage,
		// 		},
		// 		// command,
		// 	);
		// }

		// return undefined; // No hover for other cases
	}
}
