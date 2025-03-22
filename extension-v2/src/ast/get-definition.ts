import { Lang, parse } from "@ast-grep/napi";
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
 * @returns An Effect that resolves to
 * - the body,
 * - it's range,
 * - a flag indicating if it's in the workspace,
 * - and the hash of the body
 */
export function getIdentifierBody(identifierLocation: vscode.Location) {
	return Effect.gen(function* () {
		// Check if the identifier is within the workspace
		let isInWorkspace = false;
		const workspaceFolders = vscode.workspace.workspaceFolders;

		if (workspaceFolders) {
			const filePath = identifierLocation.uri.fsPath;
			isInWorkspace = workspaceFolders.some((folder) =>
				filePath.startsWith(folder.uri.fsPath),
			);
		}

		// Parse the document content into an AST using ast-grep
		const document = yield* Effect.tryPromise(() =>
			vscode.workspace.openTextDocument(identifierLocation.uri),
		);
		const root = parse(Lang.Python, document.getText()).root();

		// Find the node in the AST that matches the identifier's position
		const ref = identifierLocation.range;
		const identifier = root.find({
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

		// Get the whole function definition node
		const node = identifier?.parent();
		if (node?.kind() === "assignment") {
			// TODO: this means that the identifier was created in an assignment. We ignore this for now
			return undefined;
		}
		if (!node) {
			return yield* Effect.fail(new NoParentBodyRangeFound());
		}
		const hash = yield* hashString(node.text());

		// Return the range of the parent node and the workspace flag
		return {
			range: getCodeRangeFromSgNode(node),
			text: node.text(),
			uri: identifierLocation.uri,
			isInWorkspace,
			fullHash: hash,
			shortId: getShortId(hash),
		};
	});
}
