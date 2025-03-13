import type { CodeBlock, CodeReference } from "./ast.schema";
import { Effect } from "effect";
import { summarizeCodeReference } from "./llm";

// Store for reference hashes and summaries
// This will be replaced with a database later
interface ReferenceInfo {
	id: string;
	fullHash: string;
	body: string;
	summary: string;
}

/**
 * Process multiple code references concurrently
 * @param references Array of code references to process
 * @returns Array of processed reference information
 */
export function dedupeAndSummarizeReferences(references: CodeReference[]) {
	return Effect.gen(function* () {
		const processedRefs = yield* Effect.forEach(
			references,
			(ref) => summarizeCodeReference(ref),
			{ concurrency: 5 },
		);

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
				fullHash: ref.fullHash,
				body: ref.body,
				summary: ref.summary,
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
