import type { CodeBlock, CodeReference } from "../ast/python/ast.schema";
import { Effect } from "effect";
import { Lang, parse } from "@ast-grep/napi";
import * as vscode from "vscode";
import { getAllFlowASTs } from "./python/get-all-flows";
import { getGraphsFromAst } from "../graph/create-nodes";
import { getFullNodeJson } from "./python/handle-expressions";

// Store for reference hashes and summaries
// This will be replaced with a database later
interface ReferenceInfo {
	id: string;
	symbol: string;
	fullHash: string;
	body: string;
	shortBody: string;
}

/**
 * Process multiple code references concurrently
 * @param references Array of code references to process
 * @returns Array of processed reference information
 */
export function dedupeAndSummarizeReferences(references: CodeReference[]) {
	return Effect.gen(function* () {
		const processedRefs = references.map((ref) => ({
			...ref,
			shortBody:
				ref.body.length < 100
					? ref.body
					: `${ref.body.slice(0, 100)}[truncated...]`,
		}));

		// Remove duplicates
		const visitedRefHashes = new Set<string>();
		const uniqueProcessedRefs: ReferenceInfo[] = [];
		for (const ref of processedRefs) {
			if (visitedRefHashes.has(ref.fullHash)) {
				continue;
			}
			visitedRefHashes.add(ref.fullHash);
			uniqueProcessedRefs.push({
				id: ref.id,
				symbol: ref.symbol,
				fullHash: ref.fullHash,
				body: ref.body,
				shortBody: ref.shortBody,
			});
		}

		return uniqueProcessedRefs;
	});
}

/**
 * Flattens the AST and extracts just the references
 * @param ast The AST to extract references from
 * @returns Array of all references found in the AST
 */
export function getFlatReferencesListFromAST(
	ast: CodeBlock[],
): CodeReference[] {
	const references: CodeReference[] = [];

	// Recursive function to traverse the AST
	function traverse(node: CodeBlock) {
		// If the node has references, add them to the list
		if (node.references && Array.isArray(node.references)) {
			references.push(...node.references);
		}

		// Recursively traverse children
		if (node.children && Array.isArray(node.children)) {
			for (let i = 0; i < node.children.length; i++) {
				traverse(node.children[i]);
			}
		}
	}

	// Traverse each top-level node
	for (let i = 0; i < ast.length; i++) {
		traverse(ast[i]);
	}

	return references;
}

/**
 * Gets the nodes for a reference
 * @param ref The reference to get nodes for
 * @returns The nodes for the reference
 */
export function getReferenceGraphs(ref: CodeReference, isStartingRef: boolean) {
	return Effect.gen(function* () {
		const document = yield* Effect.tryPromise(() =>
			vscode.workspace.openTextDocument(ref.filePath),
		);
		const root = parse(Lang.Python, document.getText()).root();
		const defNode = root.find({
			rule: {
				range: {
					start: {
						line: ref.range.start.line,
						column: ref.range.start.character,
					},
					end: {
						line: ref.range.end.line,
						column: ref.range.end.character,
					},
				},
			},
		});
		const block = defNode?.children().find((x) => x.kind() === "block");
		if (!block || !defNode) {
			console.error(
				`No block found on ref search:\n\`\`\`\n${defNode?.text()}\n\`\`\``,
			);
			return { graphs: [], references: [], refID: undefined };
		}

		// Check if defNode is a class and find __init__ if it exists
		let blockChildren = block.children();
		if (defNode.kind() === "class_definition") {
			// Find the __init__ method if it exists
			const initFuncDef = blockChildren.find((node) => {
				// Look for function definition nodes
				if (node.kind() === "function_definition") {
					// Check if this is the __init__ method
					const funcName = node
						.children()
						.find((x) => x.kind() === "identifier");
					return funcName && funcName.text() === "__init__";
				}
				return false;
			});

			// If __init__ exists, flatten it into the class body
			if (initFuncDef) {
				// Get the block of the __init__ function
				const initBlock = initFuncDef
					.children()
					.find((x) => x.kind() === "block");
				if (initBlock) {
					// Combine the class block children with the __init__ block children
					blockChildren = [...blockChildren, ...initBlock.children()];
				}
			}
		}

		const ast = yield* getAllFlowASTs({
			root: blockChildren,
			parent_id: "",
			url: document.uri,
		});

		const signature = defNode?.commitEdits([
			block.replace(`<${defNode.kind()}_body/>`),
		]);

		const { graphs, references } = yield* getGraphsFromAst(
			ast,
			ref.filePath,
			defNode,
			isStartingRef,
			signature,
		);

		return { graphs, references, refID: ref.id, signature };
	});
}
