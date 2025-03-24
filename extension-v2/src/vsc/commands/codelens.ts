import * as vscode from "vscode";
import { parse, Lang, type SgNode, type SgRoot } from "@ast-grep/napi";
import type { CodeReference as PythonCodeReference } from "../../ast/python/ast.schema";
import type { CodeReference as TypeScriptCodeReference } from "../../ast/typescript/ast.schema";
import {
	getIdentifierBody,
	type NoParentBodyRangeFound,
} from "../../ast/get-definition";
import { Effect } from "effect";
import type { UnknownException } from "effect/Cause";
// import type { Reference } from "../ast/python/flow";

type CodeLensError = NoParentBodyRangeFound | UnknownException;
type CodeReference = PythonCodeReference | TypeScriptCodeReference;

/**
 * 🐍 Add code lenses to Python AST nodes
 */
function add_python_ast_node_to_code_lens(
	document: vscode.TextDocument,
	node: SgNode,
): Effect.Effect<vscode.CodeLens[], CodeLensError> {
	return Effect.gen(function* () {
		const codeLensChildren = yield* Effect.forEach(node.children(), (child) =>
			add_python_ast_node_to_code_lens(document, child),
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

		return yield* createCodeLens(
			document,
			identifierNode,
			codeLensChildren,
			Lang.Python,
		);
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

/**
 * 🔍 Add code lenses to Typescript AST nodes
 */
function add_typescript_ast_node_to_code_lens(
	document: vscode.TextDocument,
	node: SgNode,
): Effect.Effect<vscode.CodeLens[], CodeLensError> {
	return Effect.gen(function* () {
		const codeLensChildren = yield* Effect.forEach(node.children(), (child) =>
			add_typescript_ast_node_to_code_lens(document, child),
		).pipe(Effect.map((children) => children.flat()));

		const allowedNodeKinds = [
			"class_declaration",
			"method_definition",
			"function_declaration",
			"arrow_function",
		];

		if (!allowedNodeKinds.includes(String(node.kind()))) {
			return codeLensChildren;
		}

		let identifierNode: SgNode | undefined;

		switch (node.kind()) {
			case "class_declaration":
			case "function_declaration":
				identifierNode = node
					.children()
					.find((child) => child.kind() === "identifier");
				break;
			case "method_definition":
				identifierNode = node
					.children()
					.find(
						(child) =>
							child.kind() === "property_identifier" ||
							child.kind() === "identifier",
					);
				break;
			case "arrow_function": {
				// For arrow functions, use the parent node's identifier if available
				const parent = node.parent();
				if (parent && parent.kind() === "variable_declarator") {
					identifierNode = parent
						.children()
						.find((child) => child.kind() === "identifier");
				}
				break;
			}
		}

		if (!identifierNode) {
			return codeLensChildren;
		}

		return yield* createCodeLens(
			document,
			identifierNode,
			codeLensChildren,
			Lang.TypeScript,
		);
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

/**
 * 📝 Create code lenses for a given identifier node
 */
function createCodeLens(
	document: vscode.TextDocument,
	identifierNode: SgNode,
	codeLensChildren: vscode.CodeLens[],
	lang: Lang,
): Effect.Effect<vscode.CodeLens[], CodeLensError> {
	return Effect.gen(function* () {
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
			lang,
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
	});
}

export class NodifyCodeLensProvider implements vscode.CodeLensProvider {
	async provideCodeLenses(
		document: vscode.TextDocument,
		token: vscode.CancellationToken,
	): Promise<vscode.CodeLens[]> {
		// 🐍 if we're processing a python file, use the python parser
		if (document.languageId === "python") {
			const root = parse(Lang.Python, document.getText()).root();
			return await Effect.runPromise(
				add_python_ast_node_to_code_lens(document, root),
			);
		}

		// 🔍 if we're processing a typescript file, use the typescript parser
		if (document.languageId === "typescript") {
			const root = parse(Lang.TypeScript, document.getText()).root();
			return await Effect.runPromise(
				add_typescript_ast_node_to_code_lens(document, root),
			);
		}

		console.log("unsupported language", document.languageId);
		return [];
	}

	// Optional method if you want to refresh code lens when the document changes
	public resolveCodeLens(
		codeLens: vscode.CodeLens,
		token: vscode.CancellationToken,
	): vscode.CodeLens {
		return codeLens; // don't need to resolve anything
	}
}

export function registerCodeLensProvider(
	context: vscode.ExtensionContext,
	languageId: "python" | "typescript",
) {
	return vscode.languages.registerCodeLensProvider(
		languageId,
		new NodifyCodeLensProvider(),
	);
}
