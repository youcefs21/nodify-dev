import { Lang, parse } from "@ast-grep/napi";
import { Effect } from "effect";
import * as vscode from "vscode";
import { getCodeRangeFromSgNode } from "./get-range";

export class NoParentBodyRangeFound {
	readonly _tag = "NoParentBodyRangeFound";
	readonly message = "No parent body range found";
}

/**
 * Retrieves the body range of a parent node for a given identifier location.
 *
 * Useful for finding the definition of a caller.
 *
 * @param identifierLocation - The {@link vscode.Location} of the identifier to find the parent body for
 * @returns An Effect that resolves to the range of the parent node
 */
export function getBodyRange(identifierLocation: vscode.Location) {
	return Effect.gen(function* () {
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
		if (!node) {
			return yield* Effect.fail(new NoParentBodyRangeFound());
		}

		// Return the range of the parent node
		return {
			range: getCodeRangeFromSgNode(node),
			uri: identifierLocation.uri,
		};
	});
}
