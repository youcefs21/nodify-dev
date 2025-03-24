import { Lang, type SgNode } from "@ast-grep/napi";
import type * as vscode from "vscode";
import { getAllPythonFlowASTs } from "./python/get-all-flows";
import { getAllTypescriptFlowASTs } from "./typescript/get-all-flows";
import { Effect, Unify } from "effect";

interface Props {
	root: SgNode[];
	parent_id: string;
	url: vscode.Uri;
	lang: Lang;
}

/**
 * Concurrently gets all the ASTs for all the flows in a SgNode Tree
 *
 * if you're looking for the actual AST logic, see {@link getFlowAST}
 */
export function getAllFlowASTs({ root, parent_id, url, lang }: Props) {
	return Unify.unify(
		lang === Lang.Python
			? getAllPythonFlowASTs({ root, parent_id, url })
			: getAllTypescriptFlowASTs({ root, parent_id, url }),
	).pipe(Effect.tap((a) => console.log("GOT AST", a)));
}
