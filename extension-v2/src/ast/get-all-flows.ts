import type * as vscode from "vscode";
import type { SgNode } from "@ast-grep/napi";
import { Effect, Unify } from "effect";
import { type FlowKind, flowKinds } from "./ast.schema";
import { getFlowAST } from "./get-flow";

interface Props {
	root: SgNode[];
	parent_id: string;
	url: vscode.Uri;
}

/**
 * Concurrently gets all the ASTs for all the flows in a SgNode Tree
 *
 * if you're looking for the actual AST logic, see {@link getFlowAST}
 */
export function getAllFlowASTs({ root, parent_id, url }: Props) {
	return Effect.all(
		root.map((node, i) => {
			const kind = node.kind() as FlowKind;

			// if it's a flow, handle it, otherwise return null
			return Unify.unify(
				flowKinds.some((flowKind) => flowKind === kind)
					? getFlowAST({ node, kind, parent_id, i, url })
					: Effect.succeed(null),
			);
		}),
		{ concurrency: 5 },
	).pipe(Effect.andThen((xs) => xs.filter((x) => x !== null)));
}
