import { Effect } from "effect";
import type { AbstractionGroup, LLMContext } from "./llm.schema";
import {
	getOpenAIClientFromWorkspaceConfig,
	getModelFromWorkspaceConfig,
	SHOULD_USE_MOCK,
} from "./llm-config";
import { getNodifyWorkspaceDir } from "../../utils/get-nodify-workspace-dir";
import { z } from "zod";
import fs from "node:fs/promises";
import {
	LLMError,
	abstractionGroupSchema,
	abstractionTreeSchema,
} from "./llm.schema";
import { countTokens } from "gpt-tokenizer";

export const getAbstractTreeSystemPrompt = `You are an expert code analyzer. Your task is to analyze the provided AST structure and create a meaningful abstraction hierarchy.

TASK: Analyze the provided AST-parsed code and create an abstraction hierarchy with logical groupings.

INSTRUCTIONS:
1. Examine the provided AST structure with its nodes, text content, and references
2. Create a multi-level abstraction hierarchy where groups represent related functionality
   - The depth (number of nested groups) must be:
   - 1 (nodes have no children) for very simple code.
   - 2 (nodes have children) for most code.
   - at most 3 (nodes have children, and grandchildren) for very complex code.
3. For each group:
   - Create a concise 2-6 word descriptive label
   - Specify the range of node IDs covered (from first to last in the sequence)
   - Categorize with a single-word type that broadly describes its purpose. ONLY use one of these allowed types: "documentation", "utility", "initialization", "execution", "callback", "validation", "visualization", "configuration", "processing", "security", "display", "terminal", "notification", "termination", "package", "messaging", "error", "file", "search", "loading", "folder", "conditional", "hardware", "network"
4. Ensure each leaf node contains at most ONE reference in its range
5. Group related operations together rather than treating each line as its own group
6. Your ranges must include everything. Don't skip any nodes.
7. Your output doesn't have to be in the same order as the input, instead you should order them by the logical flow of the code. This is especially important for recursive functions, and callbacks 

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
		"type": "network",
		"referenceID": "hfuh2bda"
	},
	{
		"label": "Multiply all values by 2, and return result",
		"idRange": ["2", "3"],
		"type": "processing",
		"referenceID": "abc123"
	},
  ]
}
`;

/**
 * Analyze the provided AST-parsed code and create an abstraction hierarchy with logical groupings.
 * @param input The LLM context containing AST and references
 * @returns A structured abstraction tree with hierarchical groupings
 */
export function getAbstractionTree(input: LLMContext, astHash: string) {
	return Effect.gen(function* () {
		const dirPath = getNodifyWorkspaceDir();

		const tokens = countTokens(JSON.stringify(input));
		console.log(`input tokens: ${tokens}`);

		if (SHOULD_USE_MOCK) {
			const mockFolder = `${dirPath}/ast_cache`;
			const mockPath = `${mockFolder}/${astHash}.json`;

			// make the directory if it doesn't exist
			yield* Effect.tryPromise(() => fs.mkdir(mockFolder, { recursive: true }));
			yield* Effect.tryPromise(() =>
				fs.writeFile(mockPath, JSON.stringify(input, null, 4)),
			);
			return getMockAbstractionTree(input, astHash);
		}

		const model = getModelFromWorkspaceConfig();
		const client = getOpenAIClientFromWorkspaceConfig();

		const responsePath = `${dirPath}/abstraction_tree_cache/${astHash}.json`;
		const logPath = `${dirPath}/llm_logs/${astHash}-abstraction-tree.json`;
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

		// use local model for testing purposes
		if (tokens > 15_000) {
			return [
				{
					label: "Code Chunk is too long to analyze",
					idRange: [
						input.ast[0].id,
						input.ast[input.ast.length - 1].id,
					] as const,
					type: "error",
					children: [],
				},
			] as AbstractionGroup[];
		}
		console.error(`sending request with ${tokens} tokens`);
		const message = yield* Effect.tryPromise({
			try: () =>
				client.chat.completions
					.create({
						messages: [
							{ role: "system", content: getAbstractTreeSystemPrompt },
							{ role: "user", content: JSON.stringify(input, null, 2) },
						],
						response_format: { type: "json_object" },
						model: model, //model,
						temperature: 0.5,
						max_tokens: 4000,
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
		console.error(
			`got llm response ${JSON.stringify(message.content).slice(0, 100)}...`,
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
							{ role: "system", content: getAbstractTreeSystemPrompt },
							{ role: "user", content: JSON.stringify(input, null, 2) },
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
