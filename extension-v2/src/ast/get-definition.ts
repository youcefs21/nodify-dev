import { type Lang, parse, Lang as SgLang } from "@ast-grep/napi";
import { Effect } from "effect";
import * as vscode from "vscode";
import { hashString, getShortId } from "../utils/hash";
import { getCodeRangeFromSgNode } from "../utils/get-range";

export class NoParentBodyRangeFound {
	readonly _tag = "NoParentBodyRangeFound";
	readonly message = "No parent body range found";
}

/**
 * Retrieves the body and it's range of a parent node for a given identifier location.
 *
 * Useful for finding the definition of a caller.
 *
 * @param identifierLocation - The {@link vscode.Location} of the identifier to find the parent body for
 * @param lang - The language to use for parsing (defaults to Python if not specified)
 * @returns An Effect that resolves to
 * - the body,
 * - it's range,
 * - a flag indicating if it's in the workspace,
 * - and the hash of the body
 */
export function getIdentifierBody(
	identifierLocation: vscode.Location | vscode.LocationLink,
	lang: Lang = SgLang.Python,
) {
	return Effect.gen(function* () {
		const is_location_link = "targetUri" in identifierLocation;
		const uri =
			"uri" in identifierLocation
				? identifierLocation.uri
				: identifierLocation.targetUri;
		const range =
			"range" in identifierLocation
				? identifierLocation.range
				: identifierLocation.targetRange;

		// Check if the identifier is within the workspace
		let isInWorkspace = false;
		const workspaceFolders = vscode.workspace.workspaceFolders;

		if (workspaceFolders) {
			const filePath = uri.fsPath;
			isInWorkspace = workspaceFolders.some((folder) => {
				const folderPath = folder.uri.fsPath;
				return (
					filePath.startsWith(folderPath) && !filePath.includes("node_modules")
				);
			});
			if (!isInWorkspace) {
				return undefined;
			}
		}

		// Parse the document content into an AST using ast-grep
		const document = yield* Effect.tryPromise(() =>
			vscode.workspace.openTextDocument(uri),
		);
		const root = parse(lang, document.getText()).root();

		// Find the node in the AST that matches the identifier's position
		const ref = range;
		let node = root.find({
			rule: {
				range: {
					start: {
						line: ref.start.line,
						column: ref.start.character,
					},
					end: {
						line: ref.end.line,
						column: ref.end.character,
					},
				},
			},
		});
		if (!node) {
			console.error(
				`No identifier found for location ${uri.fsPath}:${range.start.line}:${range.start.character}`,
			);
			// return yield* Effect.fail(new NoParentBodyRangeFound());
			return undefined;
		}

		// Get the whole function or class definition node
		if (!is_location_link) {
			node = node.parent();
		}

		if (!node) {
			console.error(
				`No parent node found for identifier at location ${uri.fsPath}:${range.start.line}:${range.start.character}`,
			);
			return yield* Effect.fail(new NoParentBodyRangeFound());
		}

		// Different node kinds for Python and TypeScript
		const isValidPythonNode =
			node.kind() === "function_definition" ||
			node.kind() === "class_definition";

		const isValidTypeScriptNode =
			node.kind() === "function_declaration" ||
			node.kind() === "class_declaration" ||
			node.kind() === "method_definition" ||
			node.kind() === "arrow_function" ||
			node.kind() === "generator_function" ||
			node.kind() === "variable_declarator" ||
			node.kind() === "export_statement";

		// Skip anything that isn't a function or class definition
		if (
			(lang === SgLang.Python && !isValidPythonNode) ||
			(lang === SgLang.TypeScript && !isValidTypeScriptNode)
		) {
			// console.error(
			// 	`Invalid node kind (${node.kind()}) for identifier at location ${uri.fsPath}:${range.start.line}:${range.start.character}`,
			// );
			return undefined;
		}

		if (node.kind() === "export_statement") {
			node = node.children()[1];
		}

		const hash = yield* hashString(node.text());

		// Return the range of the parent node and the workspace flag
		return {
			range: getCodeRangeFromSgNode(node),
			text: node.text(),
			uri,
			isInWorkspace,
			fullHash: hash,
			shortId: getShortId(hash),
		};
	});
}
