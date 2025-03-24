import { Lang, type SgNode } from "@ast-grep/napi";
import type * as vscode from "vscode";
import { getAllPythonFlowASTs } from "./python/get-all-flows";
import { getAllTypescriptFlowASTs } from "./typescript/get-all-flows";

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
	if (lang === Lang.Python) {
		return getAllPythonFlowASTs({ root, parent_id, url });
	}
	return getAllTypescriptFlowASTs({ root, parent_id, url });
}
