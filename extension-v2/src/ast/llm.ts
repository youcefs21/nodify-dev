import { Effect } from "effect";
import type { CodeReference } from "../ast/ast.schema";
import OpenAI from "openai";
import z from "zod";
import { zodResponseFormat } from "openai/helpers/zod.mjs";

const VLLM_URL = "http://100.89.180.124:6969";
const OLLAMA_URL = "http://localhost:11434";
const model = "unsloth/phi-4-bnb-4bit";

const client = new OpenAI({
	baseURL: `${VLLM_URL}/v1`,
	apiKey: "key",
});

const summarySchema = z.object({
	summary: z.string(),
});

/**
 * Simulate LLM-based code summarization
 * This is a placeholder for future implementation with an actual LLM
 * @param code The code to summarize
 * @returns A simulated LLM-generated summary
 */
export function summarizeCodeReference(ref: CodeReference) {
	return Effect.gen(function* () {
		// For very short code snippets, just use the code itself as the summary
		if (ref.body.length < 100) {
			return {
				...ref,
				summary: ref.body,
			};
		}

		const systemPrompt = `
Summarize code snippets concisely. Focus on core functionality only.

RULES:
- Keep summaries shorter than the code itself
- For short functions (< 5 lines), use 5-15 words
- For medium and large code blocks, use 1-2 sentences
- Start with verbs (e.g., "Calculates" not "This calculates")
- Omit phrases like "this function" or "this code"
- Use technical terms appropriate for developers

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
  "summary": "Calculates arithmetic mean for a list of numbers"
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

		const summary = res.choices[0].message.content;

		return {
			...ref,
			summary: summary ?? ref.body.slice(0, 100),
		};
	});
}

/**
 * TASK: Analyze the provided AST-parsed Python code and create an abstraction hierarchy with logical groupings.
 *
 * INSTRUCTIONS:
 * 1. Examine the provided AST structure with its nodes, text content, and references
 * 2. Create a multi-level abstraction hierarchy where:
 *    - Top-level groups represent high-level concepts (most abstract)
 *    - Mid-level groups represent related functionality
 *    - Leaf nodes represent specific code operations (least abstract)
 * 3. For each group:
 *    - Assign an incrementing groupID starting from 0
 *    - Create a concise 2-8 word descriptive label
 *    - Specify the range of node IDs covered (from first to last in the sequence)
 *    - Categorize with a single-word type that broadly describes its purpose
 *    - Include children nodes as nested groups when appropriate
 * 4. Ensure each leaf node contains at most ONE reference in its range
 * 5. Group related operations together rather than treating each line as its own group
 *
 * OUTPUT FORMAT:
 * {
 *   "output": [
 *     {
 *       "groupID": number,
 *       "label": "2-8 word description",
 *       "idRange": [string, string],
 *       "type": "single_word_category",
 *       "children": [
 *         // Same structure for child nodes (when present in input)
 *       ]
 *     },
 *     // Additional groups as needed
 *   ]
 * }
 *
 * CATEGORIES TO CONSIDER:
 * - initialization
 * - configuration
 * - data_processing
 * - model_setup
 * - training
 * - utility
 * - documentation
 * - main
 * - callback
 *
 * IMPORTANT: Each leaf node must contain AT MOST ONE reference.
 */
export function getAbstractionTree() {}
