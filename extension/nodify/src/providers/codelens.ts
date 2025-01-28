import * as vscode from "vscode";
import { CodeBlock, getAST } from "../ast/flow";
import { parse, Lang, type SgNode, type SgRoot } from "@ast-grep/napi";

export class NodifyCodeLensProvider implements vscode.CodeLensProvider {
	// This function defines where you want to show your CodeLens
	// public add_code_block_to_code_lens(
	// 	document: vscode.TextDocument,
	// 	codeblock: CodeBlock,
	// ): vscode.CodeLens[] {
	// 	// const codeLens = new vscode.CodeLens(codeblock.location);
	// 	// codeLens.command = {
	// 	// 	title: `Open Nodify at ${codeblock.text}`,
	// 	// 	command: "nodify.openWebview",
	// 	// 	arguments: [
	// 	// 		codeblock.text,
	// 	// 		codeblock.location.start.line,
	// 	// 		document.fileName,
	// 	// 	],
	// 	// };
	// 	// const codeblockChildren = codeblock.children ?? [];
	// 	// return [codeLens].concat(
	// 	// 	codeblockChildren.flatMap((child) =>
	// 	// 		this.add_code_block_to_code_lens(document, child),
	// 	// 	),
	// 	// );
	// }
	public add_ast_node_to_code_lens(
		document: vscode.TextDocument,
		node: SgNode,
	): vscode.CodeLens[] {
		const codeLensChildren = node
			.children()
			.flatMap((child) => this.add_ast_node_to_code_lens(document, child));

		const allowedNodeKinds = [
			"class_definition",
			"function_definition",
			"call",
		];

		if (!allowedNodeKinds.includes(String(node.kind()))) {
			return codeLensChildren;
		}

		const definitionRegex = /(class|def) (\w+)/;
		const callerRegex = /((\w|\.)+)\(/;
		const identifierName =
			node.text().match(definitionRegex)?.[2] ??
			node.text().match(callerRegex)?.[1] ??
			"Unknown";

		const range = node.range();
		const codeLens = new vscode.CodeLens(
			new vscode.Range(range.start.line, 0, range.start.line, 0),
		);

		codeLens.command = {
			title: `Open Nodify at ${node.kind()}, ${identifierName}`,
			command: "nodify.openWebview",
			arguments: [
				identifierName,
				node.text(),
				node.range().start.line,
				document.fileName,
			],
		};
		return [codeLens].concat(codeLensChildren);
	}

	async provideCodeLenses(
		document: vscode.TextDocument,
		token: vscode.CancellationToken,
	): Promise<vscode.CodeLens[]> {
		// Lenses to add
		// Class definition
		// Function definition
		// Top of modules
		// When a function is called
		// When a class is called

		//
		// const classDefPattern = /class (\w+)/g;
		// const funcDefPattern = /def (\w+)/g;
		// const callablePattern = /([^ ]+)\(/g;
		// const allRegex = /class (\w+)|def (\w+)|((\w|\.)+)\(/g;
		// const allRegex = /class (\w+)|def (\w+)|((\w|\.)+)\(/g;
		const root = parse(Lang.Python, document.getText()).root();
		const codeLenses = this.add_ast_node_to_code_lens(document, root);

		// const codeBlocks = await getAST(document);
		// const codeLenses: vscode.CodeLens[] = codeBlocks.flatMap((codeBlock) =>
		// 	this.add_code_block_to_code_lens(document, codeBlock),
		// );
		// for (const codeBlock of codeBlocks) {
		// 	// const range = new vscode.Range(
		// 	// 	document.positionAt(codeBlock.location.start.line),
		// 	// 	document.positionAt(codeBlock.location.end.line),
		// 	// );
		// 	const codeLens = new vscode.CodeLens(codeBlock.location);
		// 	codeLens.command = {
		// 		title: `Open Nodify at ${codeBlock.text}`,
		// 		command: "nodify.openWebview",
		// 		arguments: [
		// 			codeBlock.text,
		// 			codeBlock.location.start.line,
		// 			document.fileName,
		// 		],
		// 	};
		// 	codeLenses.push(codeLens);
		// }

		// const multistringRegex = /'''|"""/g;
		// let inMultiString = false;

		// const allRegex =
		// 	/(?<!['"])(?<!#)(?:(?<=^|\s)(class|def)\s(\w+)|(\w+(\.\w+)*\())/g;

		// for (let i = 0; i < document.lineCount; i++) {
		// 	const line = document.lineAt(i);
		// 	if

		// }

		// Find class definitions
		// let match;
		// while ((match = allRegex.exec(document.getText())) !== null) {
		// 	const line = document.positionAt(match.index).line;
		// 	const character = document.positionAt(match.index).character;
		// 	const range = new vscode.Range(line, 0, line + 1, 0);
		// 	const comment_symbol_index = document.getText(range).indexOf("#");
		// 	if (comment_symbol_index !== -1 && comment_symbol_index < character) {
		// 		continue;
		// 	}

		// 	let display_msg = `${comment_symbol_index},${character} `;
		// 	// let display_msg = `${match.index}, ${document.getText(range)}`;
		// 	for (let i = 1; i < match.length; i++) {
		// 		display_msg += `${i}: ${match[i]},`;
		// 	}

		// 	// if (match[1]) {
		// 	// 	display_msg = `Open Nodify at class ${match[1]}`;
		// 	// 	const codeLens = new vscode.CodeLens(range);
		// 	// 	codeLens.command = {
		// 	// 		title: display_msg,
		// 	// 		command: "nodify.openWebview",
		// 	// 		arguments: [match[1], line, document.fileName],
		// 	// 	};
		// 	// 	codeLenses.push(codeLens);
		// 	// }
		// 	// if (match[2]) {
		// 	// 	display_msg = `Open Nodify at function ${match[2]}`;
		// 	// 	const codeLens = new vscode.CodeLens(range);
		// 	// 	codeLens.command = {
		// 	// 		title: display_msg,
		// 	// 		command: "nodify.openWebview",
		// 	// 		arguments: [match[2], line, document.fileName],
		// 	// 	};
		// 	// 	codeLenses.push(codeLens);
		// 	// }
		// 	// if (match[3]) {
		// 	// 	display_msg = `Open Nodify at callable ${match[3]}`;
		// 	// 	const codeLens = new vscode.CodeLens(range);
		// 	// 	codeLens.command = {
		// 	// 		title: display_msg,
		// 	// 		command: "nodify.openWebview",
		// 	// 		arguments: [match[3], line, document.fileName],
		// 	// 	};
		// 	// 	codeLenses.push(codeLens);
		// 	// }

		// 	const codeLens = new vscode.CodeLens(range);
		// 	codeLens.command = {
		// 		// title: `Open Nodify at class ${match[1]}, DEBUG ${display_msg}`,
		// 		title: `DEBUG ${display_msg}`,
		// 		command: "nodify.openWebview", // TODO change this to update webview
		// 		arguments: [match[1], line, document.fileName],
		// 	};

		// 	codeLenses.push(codeLens);
		// 	// match = allRegex.exec(document.getText());
		// }

		// // Simple example: Add CodeLens to the first function in the document
		// const pattern = /function (\w+)/g;
		// console.log("document.getText(): ", document.getText());
		// outputChannel.appendLine(`pattern: ${pattern}`);
		// outputChannel.appendLine(`document.getText(): ${document.getText()}`);
		// let match;

		// while ((match = pattern.exec(document.getText())) !== null) {
		// 	const line = document.positionAt(match.index).line;
		// 	const range = new vscode.Range(line, 0, line, 0);

		// 	// Create CodeLens (the action that will be shown on top of the code)
		// 	const codeLens = new vscode.CodeLens(range);
		// 	codeLens.command = {
		// 		title: `Run function: ${match[1]}`, // The text that will appear on the CodeLens
		// 		command: "extension.runFunction", // Command to execute when clicked
		// 		arguments: [match[1]], // Arguments passed to the command
		// 	};
		// 	codeLenses.push(codeLens);

		// const codeLenses: vscode.CodeLens[] = [];

		// // We can display CodeLens at the very first line of the document
		// const range = new vscode.Range(0, 0, 0, 0);

		// // Create CodeLens for "Hello World"
		// const codeLens = new vscode.CodeLens(range);
		// codeLens.command = {
		// 	title: "Hello World2", // Text displayed on the CodeLens
		// 	command: "", // No specific command when clicked
		// 	arguments: [], // No arguments for this command
		// };

		// codeLenses.push(codeLens);
		return codeLenses;
	}

	// Optional: You can implement this method if you want to refresh code lens when the document changes
	public resolveCodeLens(
		codeLens: vscode.CodeLens,
		token: vscode.CancellationToken,
	): vscode.CodeLens {
		return codeLens; // In this simple example, we don't need to resolve anything
	}
}
