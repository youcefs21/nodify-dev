import * as vscode from "vscode";
import { parse, Lang, type SgNode, type SgRoot } from "@ast-grep/napi";
import type { Reference } from "../ast/flow";

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
			// "call", // TODO make settings to toggle these
		];

		if (!allowedNodeKinds.includes(String(node.kind()))) {
			return codeLensChildren;
		}

		// Right now we only care about class defs, function defs, and called functions/classes
		// TODO: this is not the correct way to do this, ast-grep has a specific way to find all nodes of a certain kind
		const identifierName =
			node
				.children()
				.find((child) => child.kind() === "identifier")
				?.text() ?? "Unknown";

		const range = node.range();
		const codeLens = new vscode.CodeLens(
			new vscode.Range(
				range.start.line,
				range.start.column,
				range.end.line,
				range.end.column,
			),
		);

		codeLens.command = {
			title: `Open Nodify at ${identifierName}`,
			command: "nodify.openWebview",
			arguments: [
				{
					symbol: identifierName,
					location: new vscode.Location(
						document.uri,
						new vscode.Range(
							range.start.line,
							range.start.column,
							range.end.line,
							range.end.column,
						),
					),
					file: document.uri,
				} satisfies Reference,
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
