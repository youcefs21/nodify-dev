import OpenAI from "openai";
import { env } from "../utils/env";
import { z } from "zod";
import type { FlowOutput } from "../types/llm.types";
import { handleFile } from "../parsers/root.handler";
import { exportJson } from "../utils/exportJson";

const openai = new OpenAI({
	apiKey: env.OPENAI_API_KEY,
});

const baseItemSchema = z.object({
	groupID: z.number(),
	label: z.string(),
	idRange: z.tuple([z.number(), z.number()]),
	type: z.enum([
		"function_call",
		"expression",
		"event_handler_setup",
		"loop",
		"conditional",
	]),
});

type Item = z.infer<typeof baseItemSchema> & {
	children?: Item[];
};

const itemSchema: z.ZodType<Item> = baseItemSchema.extend({
	children: z.lazy(() => itemSchema.array()).optional(),
});

const outputSchema = z.object({
	output: z.array(itemSchema),
});

type inputItem = {
	id: number;
	text: string;
	children?: inputItem[];
	references?: {
		name: string;
		ref_id: number;
	}[];
};
type referenceItem = {
	refID: number;
	name: string;
	description: string;
};
type inputList = {
	input: inputItem[];
	// references are just for context, not for partitioning
	references: referenceItem[];
};

async function main(input: inputList) {
	const chatCompletion = await openai.chat.completions.create({
		messages: [
			{
				role: "system",
				content: `you are a python code partitioning and labeling expert. Your job is to convert the above json into a more useful, abstract format.

your input will be a json of the following format:

\`\`\`ts
type inputItem = {
  id: number;
  text: string;
  children?: inputItem[];
  references?: {
    name: string;
    ref_id: number;
  }[];
};
type referenceItem = {
  refID: number;
  name: string;
  description: string;
}
type inputList = {
  input: inputItem[];
  // references are just for context, not for partitioning
  references: referenceItem[];
}
\`\`\`

your output type must match the following:

\`\`\`ts
type outputItem = {
  // an incrementing id for each group of code
  groupID: number;           

  // a short description 2-6 word description of the code
  label: string;              

  // the range of ids that this code represents, from the input list
  idRange: [number, number]; 

  // the type of code
  type: "function_call" | "expression" | "event_handler_setup" | "loop" | "conditional"; 

  // any nested code blocks. Only include children if the corresponding input item has children.
  children?: outputItem[]; 
}

// your actual output will be an array of these items
type outputList = {
  output: outputItem[];
}
\`\`\`

Note:
- don't include whitespace in your json output, keep it compact like the input.
- don't overlap your id ranges
`,
			},
			{
				role: "user",
				content: JSON.stringify(input),
			},
		],
		model: "gpt-4o",
		response_format: {
			type: "json_object",
		},
	});
	const output = chatCompletion.choices[0].message.content;
	console.log(output);

	if (!output) return;
	const parsed = outputSchema.safeParse(JSON.parse(output));

	if (!parsed.success) {
		console.error(parsed.error);
		return;
	}
	if (output) exportJson("llm_output", parsed.data.output);
}

const flowInput = handleFile("PythonQuest/import_test/main.py");

const input: inputList = {
	input: flowInput.blocks,
	references: flowInput.scope
		.map((x, i) => ({
			refID: i,
			name: x.name,
			// TODO: do a proper description
			description: x.kind,
		}))
		.filter((ref) =>
			flowInput.blocks.some((block) =>
				block.references?.some((r) => r.ref_id === ref.refID),
			),
		),
};
console.log(JSON.stringify(input, null, 2));
// await main(input);
