import type { CodeBlock, CodeReference } from "./ast.schema";

/**
 * Flattens the AST and extracts just the references
 * @param ast The AST to extract references from
 * @returns Array of all references found in the AST
 */
export function extractReferencesFromAST(ast: CodeBlock[]): CodeReference[] {
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
