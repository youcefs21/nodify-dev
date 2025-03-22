import { Effect } from "effect";
import type { CodeReference, LLMContext } from "../ast/ast.schema";
import OpenAI from "openai";
import z from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { getNodifyWorkspaceDir } from "../utils/get-nodify-workspace-dir";
import fs from "node:fs/promises";
import { getFlatReferencesListFromAST } from "./references";

const OPENAI_URL = "http://100.89.180.124:6969";
// const OPENAI_URL = "http://127.0.0.1:11434";
const model = "unsloth/phi-4-bnb-4bit";
// const model = "phi4:14b-q8_0";
const apiKey = process.env.OPENAI_API_KEY ?? "";

const client = new OpenAI({
	// baseURL: `${OPENAI_URL}/v1`,
	apiKey: apiKey,
});

const summarySchema = z.object({
	summary: z.string(),
});

class LLMError {
	readonly _tag = "LLMError";
	constructor(readonly message: string) {}
}

/**
 * Simulate LLM-based code summarization
 * This is a placeholder for future implementation with an actual LLM
 * @param code The code to summarize
 * @returns A simulated LLM-generated summary
 */
export function summarizeCodeReference(ref: CodeReference) {
	return Effect.gen(function* () {
		// For very short code snippets, just use the code itself as the summary
		if (ref.body.length < 9999999999) {
			return {
				...ref,
				summary:
					ref.body.length < 100
						? ref.body
						: `${ref.body.slice(0, 100)}[truncated...]`,
			};
		}
		const dirPath = getNodifyWorkspaceDir();
		const path = `${dirPath}/summaries_cache/${ref.fullHash}.json`;
		const exists = yield* Effect.promise(() =>
			fs
				.access(path)
				.then(() => true)
				.catch(() => false),
		);
		if (exists) {
			const data = yield* Effect.tryPromise(() =>
				fs.readFile(path, { encoding: "utf8" }),
			);
			return {
				...ref,
				summary: summarySchema.parse(JSON.parse(data)).summary,
			};
		}

		const systemPrompt = `Summarize code snippets concisely. Focus on core functionality only.

RULES:
- Keep summaries shorter than the code itself
- Respond in JSON format
- For short functions (< 5 lines), use 5-15 words
- For medium and large code blocks, use 1-2 sentences
- Omit phrases like "this function" or "this code"
- Use technical terms appropriate for developers
- Use as few words as possible to convey the most information, no need full sentences

EXAMPLE:
\`\`\`python
def calculate_average(numbers):
    total = sum(numbers)
    count = len(numbers)
    if count == 0:
        return 0
    return total / count
\`\`\`

EXAMPLE OUTPUT:
{
  "summary": "Arithmetic mean for list of numbers"
}
`;

		console.log("Summarizing code reference", ref.body.slice(0, 20));
		const res = yield* Effect.tryPromise(() =>
			client.beta.chat.completions.parse({
				messages: [
					{ role: "system", content: systemPrompt },
					{
						role: "user",
						content: ref.body,
					},
				],
				model: model,
				response_format: zodResponseFormat(summarySchema, "summary"),
				temperature: 0,
			}),
		);

		const parsed = res.choices[0].message.parsed;
		const summary = parsed?.summary ?? ref.body.slice(0, 100);
		yield* Effect.tryPromise(() =>
			fs.writeFile(path, JSON.stringify({ summary }, null, 2)),
		);

		return {
			...ref,
			summary,
		};
	});
}

// Define the types for the abstraction tree output
export type AbstractionGroup = {
	label: string;
	idRange: readonly [string, string];
	type: string;
	referenceID?: string | null;
	children?: readonly AbstractionGroup[];
};

export type AbstractionTreeOutput = {
	output: readonly AbstractionGroup[];
};

// Create a Zod schema for parsing the output
export const abstractionGroupSchema: z.ZodType<AbstractionGroup> = z.lazy(() =>
	z.object({
		label: z.string(),
		idRange: z.tuple([z.string(), z.string()]),
		type: z.string(),
		referenceID: z.string().optional().nullish(),
		children: z.array(abstractionGroupSchema).optional(),
	}),
);

export const abstractionTreeSchema = z.object({
	output: z.array(abstractionGroupSchema),
});

/**
 * Analyze the provided AST-parsed code and create an abstraction hierarchy with logical groupings.
 * @param input The LLM context containing AST and references
 * @returns A structured abstraction tree with hierarchical groupings
 */
export function getAbstractionTree(input: LLMContext, astHash: string) {
	return Effect.gen(function* () {
		const dirPath = getNodifyWorkspaceDir();
		const responsePath = `${dirPath}/abstraction_tree_cache/${astHash}.json`;
		const logPath = `${dirPath}/llm_logs/${astHash}.json`;
		const exists = yield* Effect.promise(() =>
			fs
				.access(responsePath)
				.then(() => true)
				.catch(() => false),
		);
		if (exists) {
			const data = yield* Effect.tryPromise(() =>
				fs.readFile(responsePath, { encoding: "utf8" }),
			);
			return z.array(abstractionGroupSchema).parse(JSON.parse(data));
		}

		const systemPrompt = `You are an expert code analyzer. Your task is to analyze the provided AST structure and create a meaningful abstraction hierarchy.

TASK: Analyze the provided AST-parsed code and create an abstraction hierarchy with logical groupings.

INSTRUCTIONS:
1. Examine the provided AST structure with its nodes, text content, and references
2. Create a multi-level abstraction hierarchy where:
   - Mid-level groups represent related functionality
   - Leaf nodes represent specific code operations (least abstract)
   - The depth (number of nested groups) must be at most 3 (nodes have children, and grandchildren) for very complex code, 1 (nodes have no children) for very simple code, and 2 (nodes have children) for most code. 
   - IMPORTANT: the leaf node range has to have exactly one reference. most of the time, the leaf range has a single node ([start, end] = [start, start])
3. For each group:
   - Create a concise 2-8 word descriptive label
   - Specify the range of node IDs covered (from first to last in the sequence)
   - Categorize with a single-word type that broadly describes its purpose (examples: "event_listener", "data_processor", "machine_learning", "visualization", "documentation", "utility", "main", "callback")
   - Include children nodes as nested groups when appropriate
4. Ensure each leaf node contains at most ONE reference in its range
5. Group related operations together rather than treating each line as its own group

IMPORTANT FORMATTING INSTRUCTIONS:
- You MUST respond with ONLY a valid JSON object
- The JSON MUST follow this exact structure:
{
  "output": [
    {
      "label": "2-8 word description",
      "idRange": ["start_id", "end_id"],
      "type": "single_word_category",
      "children": [
		{
			"label": "2-8 word description",
			"idRange": ["start_id", "end_id"],
			"type": "single_word_category",
			"referenceID": "optional string, don't include if this isn't a leaf node with a reference",
		},
		// ... more groups as needed
      ]
    },
    // ... more groups as needed
  ]
}
- Do not include any explanations, markdown formatting, or additional text
- Each leaf node must contain AT MOST ONE unique reference
`;

		// use local model for testing purposes
		const message = yield* Effect.tryPromise(() =>
			client.chat.completions
				.create({
					messages: [
						{ role: "system", content: systemPrompt },
						{ role: "user", content: JSON.stringify(input, null, 2) },
					],
					response_format: { type: "json_object" },
					model: "gpt-4o-mini",
				})
				.then((res) => {
					// Format OpenAI response to match Claude's content structure
					return {
						content: [
							{
								type: "text",
								text: res.choices[0].message.content || "",
							},
						],
					};
				}),
		);
		console.log(
			`got claude response ${JSON.stringify(message.content).slice(0, 100)}...`,
		);

		// Parse the response as JSON
		try {
			// Extract JSON from Claude's response
			const responseContent =
				message.content[0]?.type === "text" ? message.content[0].text : "";

			// Parse the JSON
			const parsedResponse = JSON.parse(responseContent.trim());
			const output = abstractionTreeSchema.parse(parsedResponse).output;
			yield* Effect.tryPromise(() =>
				fs.writeFile(responsePath, JSON.stringify(output, null, 2)),
			);
			yield* Effect.tryPromise(() =>
				fs.writeFile(
					logPath,
					JSON.stringify(
						[
							{ role: "user", content: input },
							{ role: "assistant", content: message },
						],
						null,
						2,
					),
				),
			);
			return output;
		} catch (error) {
			console.error("Failed to parse Claude response as JSON:", error);
			// Return a minimal valid structure if parsing fails
			return [
				{
					label: "Error parsing response",
					idRange: ["0", "0"] as const,
					type: "error",
					children: [],
				},
			] as AbstractionGroup[];
		}
	});
}

/**
 * A simple function that creates a one-to-one representation of the AST in the same output format as the LLM abstraction tree
 *
 * Useful for isolating AST problems from the LLM abstraction tree generation
 * @param input
 * @param astHash
 */
export function getMockAbstractionTree(
	input: LLMContext,
	astHash: string,
): AbstractionGroup[] {
	return input.ast.map((node) => ({
		label: node.text.length > 10 ? `${node.text.slice(0, 10)}...` : node.text,
		idRange: [node.id, node.id],
		type: "mock",
		referenceID: node.references?.[0]?.id ?? undefined,
		children: node.children
			? getMockAbstractionTree({ ...input, ast: node.children }, astHash)
			: undefined,
	}));
}
