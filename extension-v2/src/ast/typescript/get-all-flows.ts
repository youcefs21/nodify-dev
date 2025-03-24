import type * as vscode from "vscode";
import type { SgNode } from "@ast-grep/napi";
import { Effect } from "effect";
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
		root
			.filter((node) => flowKinds.some((flowKind) => flowKind === node.kind()))
			.flatMap((node) => {
				// Handle nested blocks within control statements
				const else_blocks = node
					.children()
					.filter((x) => x.kind() === "else_clause");

				const case_blocks = node
					.children()
					.filter((x) => x.kind() === "case_statement");

				const default_blocks = node
					.children()
					.filter((x) => x.kind() === "default_clause");

				return [node, ...else_blocks, ...case_blocks, ...default_blocks];
			})
			.map((node, i) =>
				getFlowAST({ node, kind: node.kind() as FlowKind, parent_id, i, url }),
			),
		{ concurrency: 5 },
	).pipe(Effect.andThen((xs) => xs.filter((x) => x !== null)));
}
