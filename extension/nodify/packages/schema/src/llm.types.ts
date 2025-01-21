import z from "zod";

// output type
const baseItemSchema = z.object({
	groupID: z.number(),
	label: z.string(),
	idRange: z.tuple([z.number(), z.number()]),
	type: z.string(),
	expanded: z.boolean().optional(),
});

const itemSchema: z.ZodType<LLMOutput> = baseItemSchema.extend({
	children: z.lazy(() => itemSchema.array()).optional(),
});

export const outputSchema = z.object({
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

export type LLMOutput = z.infer<typeof baseItemSchema> & {
	children?: LLMOutput[];
};
