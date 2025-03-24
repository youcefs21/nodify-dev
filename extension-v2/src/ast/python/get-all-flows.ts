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
export function getAllPythonFlowASTs({ root, parent_id, url }: Props) {
	return Effect.all(
		root
			.filter((node) => flowKinds.some((flowKind) => flowKind === node.kind()))
			.flatMap((node) => {
				// this is because else are nested inside if_expression, and same with try and except
				const else_blocks = node
					.children()
					.filter((x) => x.kind() === "else_clause");
				const elif_blocks = node
					.children()
					.filter((x) => x.kind() === "elif_clause");
				const except_blocks = node
					.children()
					.filter((x) => x.kind() === "except_clause");
				const finally_blocks = node
					.children()
					.filter((x) => x.kind() === "finally_clause");

				return [
					node,
					...elif_blocks,
					...else_blocks,
					...except_blocks,
					...finally_blocks,
				];
			})
			.map((node, i) =>
				getFlowAST({ node, kind: node.kind() as FlowKind, parent_id, i, url }),
			),
		{ concurrency: 5 },
	).pipe(Effect.andThen((xs) => xs.filter((x) => x !== null)));
}
