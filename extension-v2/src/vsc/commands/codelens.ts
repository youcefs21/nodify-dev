import * as vscode from "vscode";
import { parse, Lang, type SgNode, type SgRoot } from "@ast-grep/napi";
import type { CodeReference } from "../../ast/ast.schema";
import {
	getIdentifierBody,
	type NoParentBodyRangeFound,
} from "../../ast/get-definition";
import { Effect } from "effect";
import type { UnknownException } from "effect/Cause";
// import type { Reference } from "../ast/flow";

function add_ast_node_to_code_lens(
	document: vscode.TextDocument,
	node: SgNode,
): Effect.Effect<vscode.CodeLens[]> {
	return Effect.gen(function* () {
		const codeLensChildren = yield* Effect.forEach(node.children(), (child) =>
			add_ast_node_to_code_lens(document, child),
		).pipe(Effect.map((children) => children.flat()));

		const allowedNodeKinds = ["class_definition", "function_definition"];

		if (!allowedNodeKinds.includes(String(node.kind()))) {
			return codeLensChildren;
		}

		const identifierNode = node
			.children()
			.find((child) => child.kind() === "identifier");

		if (!identifierNode) {
			return codeLensChildren;
		}
		const identifierName = identifierNode.text();
		const range = identifierNode.range();
		const codeLensRange = new vscode.Range(
			range.start.line,
			range.start.column,
			range.end.line,
			range.end.column,
		);
		const codeLens = new vscode.CodeLens(codeLensRange);

		const definitionRange = yield* getIdentifierBody(
			new vscode.Location(document.uri, codeLensRange),
		);
		if (!definitionRange) {
			return codeLensChildren;
		}

		codeLens.command = {
			title: `Open Nodify at ${identifierName}`,
			command: "nodify.openWebview",
			arguments: [
				{
					symbol: identifierName,
					id: definitionRange.shortId,
					fullHash: definitionRange.fullHash,
					body: definitionRange.text,
					range: definitionRange.range,
					filePath: definitionRange.uri.fsPath,
				} satisfies CodeReference,
			],
		};
		return [codeLens].concat(codeLensChildren);
	}).pipe(
		Effect.catchAll((error) => {
			vscode.window.showErrorMessage(
				`[ERROR - ${error._tag}] ${error.message}`,
			);
			console.error(error);
			return Effect.succeed([]);
		}),
		Effect.catchAllDefect((error) => {
			vscode.window.showErrorMessage(`DEFECT: ${error}`);
			console.error("DEFECT: ", error);
			return Effect.succeed([]);
		}),
	);
}

export class NodifyCodeLensProvider implements vscode.CodeLensProvider {
	async provideCodeLenses(
		document: vscode.TextDocument,
		token: vscode.CancellationToken,
	): Promise<vscode.CodeLens[]> {
		const root = parse(Lang.Python, document.getText()).root();
		return await Effect.runPromise(add_ast_node_to_code_lens(document, root));
	}

	// Optional method if you want to refresh code lens when the document changes
	public resolveCodeLens(
		codeLens: vscode.CodeLens,
		token: vscode.CancellationToken,
	): vscode.CodeLens {
		return codeLens; // don't need to resolve anything
	}
}

export function registerCodeLensProvider(context: vscode.ExtensionContext) {
	return vscode.languages.registerCodeLensProvider(
		"python",
		new NodifyCodeLensProvider(),
	);
}
