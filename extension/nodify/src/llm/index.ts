import OpenAI from "openai";
import { outputSchema, type inputList } from "@nodify/schema";

const openai = new OpenAI({
	baseURL: "http://127.0.0.1:11434/v1",
	apiKey: "ollama", // required but unused
});

const model = "phi4:14b-q8_0";

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

  // a short description 2-8 word description of the code
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
