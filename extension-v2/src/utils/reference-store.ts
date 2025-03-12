import { Effect } from "effect";
import { hashString } from "./hash";
import type { CodeBlock, CodeReference } from "../ast/ast.schema";
import * as vscode from "vscode";
import * as astGrep from "@ast-grep/napi";
import { Lang } from "@ast-grep/napi";
import { simulateLLMSummarization } from "./llm";
import type { UnknownException } from "effect/Cause";

// Store for reference hashes and summaries
// This will be replaced with a database later
interface ReferenceInfo {
	id: string;
	shortId: string;
	body: string;
	summary: string;
}

// For use in prompts
export interface ReferencePromptInfo {
	id: string;
	summary: string;
}

// In-memory store for references
const referenceStore: ReferenceInfo[] = [];

export function getShortId(fullHash: string): string {
	// Use first 7 characters like Git does by default
	return fullHash.substring(0, 7);
}

/**
 * Process a reference by hashing its body and creating a summary
 * @param reference The code reference to process
 * @returns The reference information including ID and summary
 */
export function processCodeReference(reference: CodeReference) {
	return Effect.gen(function* () {
		// 1. Get the body of the reference
		const body = yield* getReferenceText(reference);

		// 2. Hash the full body to use as reference ID
		const fullHash = yield* hashString(body);
		const shortId = getShortId(fullHash);

		// 3. Create a summary
		const summary = yield* simulateLLMSummarization(body);

		// Store the reference
		const referenceInfo: ReferenceInfo = {
			id: fullHash,
			shortId,
			body,
			summary,
		};

		// Check if this reference already exists
		const existingIndex = referenceStore.findIndex(
			(ref) => ref.id === fullHash,
		);
		if (existingIndex === -1) {
			// Add to store if it doesn't exist
			referenceStore.push(referenceInfo);
		}

		return referenceInfo;
	});
}

/**
 * Process multiple code references concurrently
 * @param references Array of code references to process
 * @returns Array of processed reference information
 */
export function processCodeReferences(references: CodeReference[]) {
	return Effect.gen(function* () {
		// Process all references concurrently
		const processedRefs = yield* Effect.forEach(
			references,
			(ref) => processCodeReference(ref),
			{ concurrency: 5 },
		);

		// Remove duplicates
		const visitedRefHashes = new Set<string>();
		const uniqueProcessedRefs: ReferenceInfo[] = [];
		for (const ref of processedRefs) {
			if (visitedRefHashes.has(ref.id)) {
				continue;
			}
			visitedRefHashes.add(ref.id);
			uniqueProcessedRefs.push(ref);
		}

		return uniqueProcessedRefs;
	});
}

/**
 * Export reference information for use in prompts
 * @returns A map of reference information by short ID
 */
export function getReferencesForPrompt(): Record<string, ReferencePromptInfo> {
	return referenceStore.reduce(
		(map, ref) => {
			map[ref.shortId] = {
				id: ref.shortId,
				summary: ref.summary,
			};
			return map;
		},
		{} as Record<string, ReferencePromptInfo>,
	);
}

/**
 * Update CodeBlock objects with their hash IDs
 * This modifies the original CodeBlock objects by setting their id field
 * @param codeBlocks Array of CodeBlock objects to update
 * @returns Effect that resolves when all blocks have been updated
 */
export function updateCodeBlockIds(
	codeBlocks: CodeBlock[],
): Effect.Effect<void, UnknownException> {
	return Effect.gen(function* () {
		// Process each code block
		for (let i = 0; i < codeBlocks.length; i++) {
			const block = codeBlocks[i];
			const body = block.text;

			// Hash the body
			const fullHash = yield* hashString(body);
			const shortId = getShortId(fullHash);

			// Update the block's ID
			block.id = shortId;

			// Process children recursively if they exist
			if (block.children && block.children.length > 0) {
				yield* updateCodeBlockIds(block.children);
			}
		}
	});
}

/**
 * Get the text of a reference from its location
 * @param reference The code reference containing location information
 * @returns The text of the reference
 */
export function getReferenceText(reference: CodeReference) {
	return Effect.gen(function* () {
		// Get the document from the file path
		const uri = vscode.Uri.file(reference.filePath);
		const document = yield* Effect.tryPromise(
			() => vscode.workspace.openTextDocument(uri), // TODO: is this the right way to pen a document?
		);

		// Get the text of the document
		const text = document.getText();

		// Parse the document and find the node at the reference location
		const root = astGrep.parse(Lang.Python, text).root();
		const node = root.find({
			rule: {
				range: {
					start: {
						line: reference.range.start.line,
						column: reference.range.start.character,
					},
					end: {
						line: reference.range.end.line,
						column: reference.range.end.character,
					},
				},
			},
		});

		if (!node) {
			console.error("No node found for reference", reference);
			return yield* Effect.fail(new Error("No node found for reference"));
		}

		return node.text();
	});
}
