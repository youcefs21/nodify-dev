import { Lang, type SgNode } from "@ast-grep/napi";
import type * as vscode from "vscode";
import { getAllPythonFlowASTs } from "./python/get-all-flows";
import { getAllTypescriptFlowASTs } from "./typescript/get-all-flows";
import { Effect, Unify } from "effect";
import { getFullNodeJson } from "./typescript/handle-expressions";
import { hashString } from "../utils/hash";
import { graphCache } from "../vsc/show-open-file";

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
	console.log(root.map(getFullNodeJson));
	return Effect.gen(function* () {
		const ast = yield* Unify.unify(
			lang === Lang.Python
				? getAllPythonFlowASTs({ root, parent_id, url })
				: getAllTypescriptFlowASTs({ root, parent_id, url }),
		);
		console.log("GOT AST", ast);
		const hash = yield* hashString(JSON.stringify(ast));
		if (graphCache.visitedASTHashes.has(hash)) {
			return [];
		}
		graphCache.visitedASTHashes.add(hash);
		return ast;
	});
}
