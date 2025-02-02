import * as vscode from "vscode";
import { CodeBlock, getAST } from "../ast/flow";
import { parse, Lang, type SgNode, type SgRoot } from "@ast-grep/napi";

export class NodifyCodeLensProvider implements vscode.CodeLensProvider {
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
			"call", // TODO make settings to toggle these
		];

		if (!allowedNodeKinds.includes(String(node.kind()))) {
			return codeLensChildren;
		}

		// Right now we only care about class defs, function defs, and called functions/classes
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
			title: `Open Nodify at ${identifierName}`,
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
		const root = parse(Lang.Python, document.getText()).root();
		const codeLenses = this.add_ast_node_to_code_lens(document, root);
		return codeLenses;
	}

	// Optional  method if you want to refresh code lens when the document changes
	public resolveCodeLens(
		codeLens: vscode.CodeLens,
		token: vscode.CancellationToken,
	): vscode.CodeLens {
		return codeLens; // don't need to resolve anything
	}
}
