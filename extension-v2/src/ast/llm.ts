import { Effect } from "effect";
import type { LLMContext } from "../ast/ast.schema";
import OpenAI from "openai";
import z from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { getNodifyWorkspaceDir } from "../utils/get-nodify-workspace-dir";
import fs from "node:fs/promises";
import { hashString } from "../utils/hash";
import vscode from "vscode";

// const OPENAI_URL = "http://100.89.180.124:6969";
// const OPENAI_URL = "http://127.0.0.1:11434";
// const model = "unsloth/phi-4-bnb-4bit";
// const model = "phi4:14b-q8_0";
const apiKey = process.env.OPENAI_API_KEY ?? "";

function getModelFromWorkspaceConfig() {
	const config = vscode.workspace.getConfiguration("nodify");
	// No default defined here, instead define it in package.json
	const model_id = config.get<string>("LLMModelID");
	if (!model_id) {
		console.error(
			"No model ID found in workspace config. Defaulting to gpt-4o-mini",
		);
		return "gpt-4o-mini";
	}
	return model_id;
}

export function getOpenAIClientFromWorkspaceConfig() {
	const config = vscode.workspace.getConfiguration("nodify");
	// fallback to openai server
	const server_ip = config.get<string>("LLMServerIP");

	if (!server_ip) {
		return new OpenAI({
			apiKey: apiKey,
		});
	}
	return new OpenAI({
		baseURL: `${server_ip}/v1`,
		apiKey: apiKey,
	});
}

// const client = new OpenAI({
// 	// baseURL: `${OPENAI_URL}/v1`,
// 	apiKey: apiKey,
// });

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
export function summarizeCode(code: string) {
	return Effect.gen(function* () {
		const model = getModelFromWorkspaceConfig();
		const client = getOpenAIClientFromWorkspaceConfig();

		// For very short code snippets, just use the code itself as the summary
		const dirPath = getNodifyWorkspaceDir();
		const codeHash = yield* hashString(code);
		const path = `${dirPath}/summaries_cache/${codeHash}.json`;
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
				summary: summarySchema.parse(JSON.parse(data)).summary,
			};
		}

		const systemPrompt = `Summarize code snippets concisely. Focus on core functionality only.

RULES:
- Keep summaries shorter than the code itself
- Respond in JSON format
- For short functions (< 5 lines), use 5-15 words
- For medium and large code blocks, use 1-2 sentences
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

		console.log("Summarizing code", code.slice(0, 20));
		const res = yield* Effect.tryPromise({
			try: () =>
				client.beta.chat.completions.parse({
					messages: [
						{ role: "system", content: systemPrompt },
						{
							role: "user",
							content: code,
						},
					],
					model: model,
					response_format: zodResponseFormat(summarySchema, "summary"),
					temperature: 0,
				}),
			catch: (error) => {
				console.error("Failed to summarize code", error);
				return new LLMError(
					error instanceof Error ? error.message : "Unknown error",
				);
			},
		});

		const parsed = res.choices[0].message.parsed;
		const summary = parsed?.summary ?? code.slice(0, 100);
		yield* Effect.tryPromise(() =>
			fs.writeFile(path, JSON.stringify({ summary }, null, 2)),
		);

		return {
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
		const model = getModelFromWorkspaceConfig();
		const client = getOpenAIClientFromWorkspaceConfig();

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
2. Create a multi-level abstraction hierarchy where groups represent related functionality
   - The depth (number of nested groups) must be:
   - 1 (nodes have no children) for very simple code.
   - 2 (nodes have children) for most code.
   - at most 3 (nodes have children, and grandchildren) for very complex code.
3. For each group:
   - Create a concise 2-8 word descriptive label
   - Specify the range of node IDs covered (from first to last in the sequence)
   - Categorize with a single-word type that broadly describes its purpose (examples: "event_listener", "data_processor", "machine_learning", "visualization", "documentation", "utility", "main", "callback")
4. Ensure each leaf node contains at most ONE reference in its range
5. Group related operations together rather than treating each line as its own group
6. Your ranges must include everything. Don't skip any nodes.

IMPORTANT FORMATTING INSTRUCTIONS:
- You MUST respond with ONLY a valid JSON object
- idRange is a 2-element array of strings, representing the start and end of the range. Use the node IDs from the input. 
   - IMPORTANT: must be exactly 2 elements, if start and end are the same, use the same ID twice.
- Do not include any explanations, markdown formatting, or additional text
- The JSON MUST follow be exactly of type \`AbstractionTreeOutput\`:

type AbstractionGroup = {
	label: string;
	idRange: [string, string];
	type: string;
	referenceID?: string | null;
	children?: readonly AbstractionGroup[];
};

type AbstractionTreeOutput = {
	output: readonly AbstractionGroup[];
};


### EXAMPLE INPUT:
{
  "filePath": "/simple-app/src/utils.js",
  "context": "function handleData() { ... }",
  "ast": [
    {
      "id": "0",
      "text": "const data = fetchDataFromAPI()"
	  "references": [
		{
			"symbol": "fetchDataFromAPI",
			"id": "hfuh2bda"
		}
	  ]
    },
    {
      "id": "1",
      "text": "if (!data) { ... }",
      "children": [
        {
          "id": "1.0",
          "text": "console.error('Failed to fetch data')"
        },
        {
          "id": "1.1",
          "text": "return null"
        }
      ]
    },
    {
      "id": "2",
      "text": "const processedData = processData(data)",
      "references": [
        {
          "symbol": "processData",
          "id": "abc123"
        }
      ]
    },
    {
      "id": "3",
      "text": "return processedData"
    }
  ],
  "references": {
    "abc123": {
      "shortBody": "function processData(rawData) { return rawData.map(item => item.value * 2) }",
      "symbol": "processData"
    },
    "hfuh2bda": {
      "shortBody": "function fetchDataFromAPI() { return fetch('https://api.example.com/data').then(res => res.json()) }",
      "symbol": "fetchDataFromAPI"
    }
  }
}

### EXAMPLE OUTPUT:
{
  "output": [
	{
		"label": "Fetch data and return null if failed",
		"idRange": ["0", "1.1"],
		"type": "network_call",
		"referenceID": "hfuh2bda"
	},
	{
		"label": "Multiply all values by 2, and return result",
		"idRange": ["2", "3"],
		"type": "data_processor",
		"referenceID": "abc123"
	},
  ]
}
`;

		// use local model for testing purposes
		const message = yield* Effect.tryPromise({
			try: () =>
				client.chat.completions
					.create({
						messages: [
							{ role: "system", content: systemPrompt },
							{ role: "user", content: JSON.stringify(input, null, 2) },
						],
						response_format: { type: "json_object" },
						model: model, //model,
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
			catch: (error) => {
				console.error("Failed to get abstraction tree", error);
				return new LLMError(
					error instanceof Error ? error.message : "Unknown error",
				);
			},
		});
		console.log(
			`got claude response ${JSON.stringify(message.content).slice(0, 100)}...`,
		);

		// Extract JSON from Claude's response
		const responseContent =
			message.content[0]?.type === "text" ? message.content[0].text : "";

		// Parse the response as JSON
		try {
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
			console.error(
				"Failed to parse Claude response as JSON:",
				error,
				responseContent,
			);
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
