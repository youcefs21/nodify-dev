import { Effect } from "effect";
import type { AbstractionGroup, LLMContext } from "./llm.schema";
import {
	getOpenAIClientFromWorkspaceConfig,
	getModelFromWorkspaceConfig,
} from "./llm-config";
import { getNodifyWorkspaceDir } from "../../utils/get-nodify-workspace-dir";
import { z } from "zod";
import fs from "node:fs/promises";
import {
	LLMError,
	abstractionGroupSchema,
	abstractionTreeSchema,
} from "./llm.schema";

export const SHOULD_USE_MOCK = true;

/**
 * Analyze the provided AST-parsed code and create an abstraction hierarchy with logical groupings.
 * @param input The LLM context containing AST and references
 * @returns A structured abstraction tree with hierarchical groupings
 */
export function getAbstractionTree(input: LLMContext, astHash: string) {
	return Effect.gen(function* () {
		if (SHOULD_USE_MOCK) {
			return getMockAbstractionTree(input, astHash);
		}

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
