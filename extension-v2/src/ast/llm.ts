import { Effect } from "effect";
import type { CodeReference, LLMContext } from "../ast/ast.schema";
import OpenAI from "openai";
import z from "zod";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import Anthropic from "@anthropic-ai/sdk";

const claude = new Anthropic();

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

		const summary = res.choices[0].message.content;

		return {
			...ref,
			summary: summary ?? ref.body.slice(0, 100),
		};
	});
}

// Define the types for the abstraction tree output
export type AbstractionGroup = {
	groupID: number;
	label: string;
	idRange: readonly [string, string];
	type: string;
	children?: readonly AbstractionGroup[];
};

export type AbstractionTreeOutput = {
	output: readonly AbstractionGroup[];
};

// Create a Zod schema for parsing the output
export const abstractionGroupSchema: z.ZodType<AbstractionGroup> = z.lazy(() =>
	z.object({
		groupID: z.number(),
		label: z.string(),
		idRange: z.tuple([z.string(), z.string()]),
		type: z.string(),
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
export function getAbstractionTree(input: LLMContext) {
	return Effect.gen(function* () {
		const systemPrompt = `You are an expert code analyzer. Your task is to analyze the provided AST structure and create a meaningful abstraction hierarchy.

TASK: Analyze the provided AST-parsed code and create an abstraction hierarchy with logical groupings.

INSTRUCTIONS:
1. Examine the provided AST structure with its nodes, text content, and references
2. Create a multi-level abstraction hierarchy where:
   - Top-level groups represent high-level concepts (most abstract)
   - Mid-level groups represent related functionality
   - Leaf nodes represent specific code operations (least abstract)
   - The depth doesn't have to be exactly 3, it can be more or less depending on the complexity of the code. What's important, the leaf node range has to have exactly one reference. It's okay if the leaf range has a single node ([start, end] = [start, start])
3. For each group:
   - Assign an incrementing groupID starting from 0
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
      "groupID": number,
      "label": "2-8 word description",
      "idRange": [string, string],
      "type": "single_word_category",
      "children": [
		{
			"groupID": number,
			"label": "2-8 word description",
			"idRange": [string, string],
			"type": "single_word_category",
			"children": [
				// recursive output list of groups
			]
		},
		// ... more groups as needed
      ]
    },
    // Additional groups as needed
  ]
}
- Do not include any explanations, markdown formatting, or additional text
- Each leaf node must contain AT MOST ONE unique reference
`;

		// const message = yield* Effect.tryPromise(() =>
		// 	claude.messages.create({
		// 		max_tokens: 4096,
		// 		system: systemPrompt,
		// 		messages: [{ role: "user", content: JSON.stringify(input, null, 2) }],
		// 		temperature: 0,
		// 		model: "claude-3-7-sonnet-20250219",
		// 	}),
		// );

		// use local model for testing purposes
		const message = yield* Effect.tryPromise(() =>
			client.chat.completions
				.create({
					messages: [
						{ role: "system", content: systemPrompt },
						{ role: "user", content: JSON.stringify(input, null, 2) },
					],
					response_format: { type: "json_object" },
					model: model,
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
			return abstractionTreeSchema.parse(parsedResponse);
		} catch (error) {
			console.error("Failed to parse Claude response as JSON:", error);
			// Return a minimal valid structure if parsing fails
			return {
				output: [
					{
						groupID: 0,
						label: "Error parsing response",
						idRange: ["0", "0"] as const,
						type: "error",
						children: [],
					},
				],
			};
		}
	});
}
