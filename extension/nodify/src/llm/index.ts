import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
	baseURL: "http://100.89.180.124:11434/v1",
	apiKey: "ollama", // required but unused
});

const model = "phi4:14b-q8_0";

// output type
const baseItemSchema = z.object({
	groupID: z.number(),
	label: z.string(),
	idRange: z.tuple([z.number(), z.number()]),
	type: z.string(),
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

// Input type
export type inputItem = {
	id: number;
	text: string;
	children?: inputItem[];
};
export type inputList = {
	input: inputItem[];
};

export async function runLLM(input: inputList) {
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
};
type inputList = {
  input: inputItem[];
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

  // a one word category of the code chunk, for example "event_handler_setup"
  // try to be as broad as possible for this field
  type: string;

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
- you can do this, follow the schema, and you will be successful.
`,
			},
			{
				role: "user",
				content: JSON.stringify(input),
			},
		],
		model,
		temperature: 0,
		response_format: {
			type: "json_object",
		},
	});
	const output = chatCompletion.choices[0].message.content;
	console.log(output);

	if (!output) {
		return;
	}
	const parsed = outputSchema.safeParse(JSON.parse(output));

	if (!parsed.success) {
		console.error(parsed.error);
		return;
	}
	return parsed.data.output;
}
