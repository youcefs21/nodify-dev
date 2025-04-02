import fs from "node:fs";
import path from "node:path";
import z from "zod";
const getAbstractTreeSystemPrompt = `You are an expert code analyzer. Your task is to analyze the provided AST structure and create a meaningful abstraction hierarchy.

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
import type { AbstractionGroup } from "../src/ast/llm/llm.schema";

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

const IconTypeMapping = {
	// Direct mappings (same name as core)
	main: "main",
	documentation: "documentation",
	utility: "utility",
	initialization: "initialization",
	execution: "execution",
	callback: "callback",
	validation: "validation",
	visualization: "visualization",
	configuration: "configuration",
	processing: "processing",
	security: "security",
	display: "display",
	terminal: "terminal",
	notification: "notification",
	termination: "termination",
	package: "package",
	messaging: "messaging",
	error: "error",
	file: "file",
	search: "search",
	loading: "loading",
	folder: "folder",
	conditional: "conditional",
	hardware: "hardware",
	network: "network",

	// Additional terms mapped to core icons
	constructor: "initialization",
	code: "execution",
	data_processor: "processing",
	data_validation: "validation",
	preparation: "processing",
	data_initialization: "data",
	dataset_initialization: "data",
	data_loading: "data",
	setup: "initialization",
	type_management: "processing",
	exit_code_processor: "processing",
	build_processor: "processing",
	build_process: "processing",
	build_execution: "processing",
	exit_code_logic: "terminal",
	process_termination: "termination",
	package_management: "package",
	stream_handler: "data",
	statistics: "visualization",
	post_processing: "processing",
	message_display: "messaging",
	exit: "termination",
	argument_handler: "processing",
	profiling: "visualization",
	network_call: "network",
	http_request: "network",
	api_call: "network",
	web_request: "network",
	internet: "network",
	server_connection: "network",
	socket: "network",
	remote_call: "network",
	return: "execution",
	summary: "documentation",
	finalization: "validation",
	callback_setup: "callback",
	model_initialization: "initialization",
	model_training: "processing",
	dataset_preparation: "data",
	configuration_setup: "configuration",
	execution_flow: "conditional",
	callback_method: "callback",
	callback_function: "callback",
	block_management: "utility",
	config_retrieval: "search",
	config_update: "configuration",
	logging_setup: "terminal",
	file_reading: "file",
	seed_management: "initialization",
	training_execution: "execution",
	trainer_initialization: "initialization",
	model_setup: "initialization",
	configuration_management: "configuration",
	model_architecture: "hardware",
	parameter_management: "configuration",
	vocabulary_management: "data",
	checkpointing: "data",
	training_control: "execution",
	model_management: "hardware",
	weight_initialization: "initialization",
	argument_definition: "processing",
	option_processing: "processing",
	option_handling: "processing",
	argument_parsing: "processing",
	file_operation: "file",
	reporting: "documentation",
	error_handling: "error",
	user_input: "terminal",
	argument_group: "folder",
	file_management: "file",
	conflict_resolution: "error",
	exception_handling: "error",
	file_system: "folder",
	output: "display",
	data_parsing: "data",
	return_statement: "execution",
	training_loop: "execution",
	batch_fetching: "data",
	batch_processing: "processing",
	iteration_tracking: "validation",
	file_processing: "file",
	data_aggregation: "data",
	conditional_logic: "conditional",
	recursive_call: "callback",
	logging: "terminal",
	data_structure: "data",
	data_retrieval: "search",
	sorting: "processing",
	conditional_check: "conditional",
	type_conversion: "processing",
	data_loader: "data",
	data_storage: "data",
	performance: "visualization",
	data_processing: "processing",
	cache_initialization: "initialization",
	module_update: "configuration",
	semantic_analysis: "processing",
	error_checking: "validation",
	cache_update: "data",
	iteration: "execution",
	decision_logic: "conditional",
	loop: "execution",
	counter: "validation",
	"user-interaction": "terminal",
	data_assignment: "data",
	cache_check: "validation",
	cache_retrieval: "data",
	conditional_modification: "conditional",
	return_value: "execution",
	directory_listing: "folder",
	try_block: "error",
	hashing: "security",
	filter: "processing",
	fallback_logic: "conditional",
	list_operation: "processing",

	// New mappings (3rd batch)
	assignment: "data",
	filesystem_operation: "file",
	path_processing: "file",
	error_caching: "error",
	control_flow: "execution",
	mapping: "processing",
	file_io: "file",
	file_handling: "file",
	file_check: "validation",
	cache_handling: "data",
	cache_management: "configuration",
	data_management: "data",
	data_preparation: "processing",
	object_creation: "initialization",
	error_reporting: "error",

	// New mappings (4th batch)
	recursion: "callback",
	data_tracking: "validation",
	dependency_management: "package",
	data_filtering: "processing",
	plugin_management: "package",
	flag: "configuration",
	path_construction: "file",
	method_call: "execution",
	module_search: "search",
	namespace_check: "validation",
	directory_iteration: "folder",
	data_field: "data",
	system_call: "hardware",
	config_setup: "configuration",
	error_generation: "error",
	dependency_verification: "validation",
	fallback_operation: "conditional",
	serialization: "data",
	data_population: "data",

	// New mappings (5th batch)
	directory_check: "validation",
	directory_search: "search",
	stub_check: "validation",
	state_retrieval: "data",
	plugin: "package",
	module_management: "package",
	function_call: "execution",
	calculation: "processing",
	path_setup: "initialization",
	decision: "conditional",
	variable_initialization: "initialization",
	condition_check: "conditional",
} as const;

type IconType = keyof typeof IconTypeMapping;

const summarySchema = z.object({
	summary: z.string(),
});

// Function to recursively find all JSON files in a directory
function findJsonFiles(dir: string): string[] {
	const files: string[] = [];

	const items = fs.readdirSync(dir, { withFileTypes: true });

	for (const item of items) {
		const fullPath = path.join(dir, item.name);

		if (item.isDirectory()) {
			files.push(...findJsonFiles(fullPath));
		} else if (item.isFile() && item.name.endsWith(".json")) {
			files.push(fullPath);
		}
	}

	return files;
}

// Function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
	const result = [...array];

	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}

	return result;
}

// Define a type for normalized message
interface NormalizedMessage {
	role: string;
	content: string;
}

// Define node interface for abstraction tree
interface TreeNode {
	type: string;
	name: string;
	children?: TreeNode[];
	[key: string]: unknown;
}

// Validate and map type to IconTypeMapping
function validateAndMapIconType(type: string): string {
	if (!(type in IconTypeMapping)) {
		console.error(`Invalid icon type: ${type}`);
		// throw new Error(
		// 	`Invalid icon type: ${type}. Not found in IconTypeMapping.`,
		// );
	}
	return IconTypeMapping[type as IconType] ?? type;
}

// Process and normalize a conversation from a JSON file
function processConversation(
	conversation: unknown[],
	filePath: string,
): NormalizedMessage[] {
	const result: NormalizedMessage[] = [];

	for (const rawMessage of conversation) {
		// Skip if not an object
		if (typeof rawMessage !== "object" || rawMessage === null) continue;

		// Cast to access properties (we'll check before using them)
		const message = rawMessage as Record<string, unknown>;

		// Skip if no role
		if (typeof message.role !== "string") continue;

		let normalizedContent = "";

		// Extract content based on file type
		if (filePath.includes("abstraction-tree")) {
			// Handle abstraction-tree format
			if (message.role === "system") {
				// Replace system prompt with getAbstractTreeSystemPrompt
				normalizedContent = getAbstractTreeSystemPrompt;
			} else if (message.role === "assistant" && message.content) {
				try {
					let contentObj: unknown;

					// Extract the actual JSON content from the nested structure
					if (typeof message.content === "object" && message.content !== null) {
						const contentRecord = message.content as Record<string, unknown>;
						if (
							Array.isArray(contentRecord.content) &&
							contentRecord.content.length > 0
						) {
							const contentArray = contentRecord.content as Record<
								string,
								unknown
							>[];
							if (
								contentArray[0] &&
								typeof contentArray[0] === "object" &&
								"text" in contentArray[0]
							) {
								const textContent = contentArray[0].text;
								if (typeof textContent === "string") {
									contentObj = JSON.parse(textContent);
								}
							}
						}
					} else if (typeof message.content === "string") {
						contentObj = JSON.parse(message.content);
					}

					if (!contentObj) {
						throw new Error("Could not extract content object");
					}

					// Parse with abstractionTreeSchema
					const parsedContent = abstractionTreeSchema.parse(contentObj);

					// Replace type strings with IconTypeMapping values
					const processNode = (node: TreeNode) => {
						if (node.type) {
							node.type = validateAndMapIconType(node.type);
						}
						if (node.children && Array.isArray(node.children)) {
							for (const child of node.children) {
								processNode(child);
							}
						}
					};

					// Process each node in the output array
					if (Array.isArray(parsedContent.output)) {
						for (const node of parsedContent.output) {
							processNode(node as unknown as TreeNode);
						}
					}

					normalizedContent = JSON.stringify(parsedContent);
				} catch (error) {
					console.error(`Error parsing abstraction tree: ${error}`);
					normalizedContent =
						typeof message.content === "string"
							? message.content
							: JSON.stringify(message.content);
				}
			} else {
				normalizedContent =
					typeof message.content === "string"
						? message.content
						: JSON.stringify(message.content);
			}
		} else if (filePath.includes("summary")) {
			// Handle summary format
			if (message.role === "assistant" && message.content) {
				try {
					let contentObj: unknown = null;

					// Extract the actual JSON content from the nested structure
					if (typeof message.content === "object" && message.content !== null) {
						const contentRecord = message.content as Record<string, unknown>;

						// Check for the content array structure first
						if (
							Array.isArray(contentRecord.content) &&
							contentRecord.content.length > 0
						) {
							const contentArray = contentRecord.content as Record<
								string,
								unknown
							>[];
							if (
								contentArray[0] &&
								typeof contentArray[0] === "object" &&
								"text" in contentArray[0]
							) {
								const textContent = contentArray[0].text;
								if (typeof textContent === "string") {
									contentObj = JSON.parse(textContent);
								}
							}
						}
						// Also check the choices structure as a fallback
						else if (
							Array.isArray(contentRecord.choices) &&
							contentRecord.choices.length > 0
						) {
							const choices = contentRecord.choices as Record<
								string,
								unknown
							>[];
							if (
								typeof choices[0] === "object" &&
								choices[0] !== null &&
								"message" in choices[0] &&
								typeof choices[0].message === "object" &&
								choices[0].message !== null &&
								"content" in (choices[0].message as Record<string, unknown>)
							) {
								const messageContent = (
									choices[0].message as Record<string, unknown>
								).content;
								if (typeof messageContent === "string") {
									contentObj = JSON.parse(messageContent);
								} else {
									contentObj = messageContent;
								}
							}
						}
					} else if (typeof message.content === "string") {
						contentObj = JSON.parse(message.content);
					}

					if (!contentObj) {
						throw new Error("Could not extract content object");
					}

					// Parse with summarySchema
					const parsedContent = summarySchema.parse(contentObj);
					normalizedContent = JSON.stringify(parsedContent);
				} catch (error) {
					console.error(`Error parsing summary: ${error}`);
					normalizedContent =
						typeof message.content === "string"
							? message.content
							: JSON.stringify(message.content);
				}
			} else {
				normalizedContent =
					typeof message.content === "string"
						? message.content
						: JSON.stringify(message.content);
			}
		} else {
			// Default handling
			normalizedContent =
				typeof message.content === "string"
					? message.content
					: JSON.stringify(message.content);
		}

		result.push({
			role: message.role,
			content: normalizedContent,
		});
	}

	return result;
}

// Function to generate a random path
function generateRandomPath(): string {
	const users = [
		"alex",
		"sam",
		"taylor",
		"jordan",
		"casey",
		"quinn",
		"robin",
		"morgan",
		"riley",
		"avery",
	];
	const domains = [
		"home",
		"work",
		"projects",
		"dev",
		"code",
		"personal",
		"github",
		"repos",
		"coding",
		"workspace",
	];
	const user = users[Math.floor(Math.random() * users.length)];
	const domain = domains[Math.floor(Math.random() * domains.length)];

	// Different OS path styles
	const pathStyles = [
		`/Users/${user}/${domain}/`, // macOS
		`/home/${user}/${domain}/`, // Linux
		`C:/Users/${user}/${domain}/`, // Windows
	];

	return pathStyles[Math.floor(Math.random() * pathStyles.length)];
}

// Function to replace personal paths in a string with random paths
function replacePersonalPaths(input: string): string {
	const personalPathPattern = /\/Users\/youcefboumar\/Documents\//g;
	let output = input;

	// Find all occurrences first
	const matches: string[] = [];
	let match: RegExpExecArray | null;
	personalPathPattern.lastIndex = 0;

	match = personalPathPattern.exec(input);
	while (match !== null) {
		matches.push(match[0]);
		match = personalPathPattern.exec(input);
	}

	// Then replace each occurrence with a unique random path
	for (const pathToReplace of matches) {
		const randomPath = generateRandomPath();
		// Use string replace instead of regex to avoid issues with lastIndex
		output = output.replace(pathToReplace, randomPath);
	}

	return output;
}

// Main function
function main() {
	// Find all JSON files in training-data directory
	const jsonFiles = findJsonFiles(path.join(__dirname));
	console.log(`Found ${jsonFiles.length} JSON files`);

	// Combine all JSON files (each file contains a conversation array)
	const allConversations: NormalizedMessage[][] = [];

	for (const file of jsonFiles) {
		try {
			// Skip the output file if it exists
			if (file.endsWith("combined.json")) continue;
			// Skip combine.ts if it shows up
			if (file.endsWith("combine.ts")) continue;

			const content = fs.readFileSync(file, "utf-8");
			const data = JSON.parse(content);

			if (Array.isArray(data)) {
				// Process the conversation to normalize message formats
				const processedConversation = processConversation(data, file);

				// Skip if the stringified conversation is too long
				const stringifiedLength = JSON.stringify(processedConversation).length;
				if (stringifiedLength > 30000) {
					console.log(
						`Skipping conversation from ${file} - length: ${stringifiedLength} characters`,
					);
					continue;
				}

				allConversations.push(processedConversation);
			}
		} catch (error) {
			console.error(`Error processing ${file}:`, error);
		}
	}

	console.log(`Combined ${allConversations.length} conversations`);

	// Shuffle the conversations
	const shuffledConversations = shuffleArray(allConversations);

	// Write the combined and shuffled data to a new file with no whitespace
	const outputPath = path.join(__dirname, "combined.json");

	// Replace personal paths with random paths before writing
	const jsonString = JSON.stringify(shuffledConversations, null, 2);
	const anonymizedJsonString = replacePersonalPaths(jsonString);

	fs.writeFileSync(outputPath, anonymizedJsonString);

	console.log(`Combined and shuffled data written to ${outputPath}`);
}

main();
