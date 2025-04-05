import OpenAI from "openai";

const client = new OpenAI({
	baseURL: "http://localhost:3000/v1",
	apiKey: "nodify",
});

const response = await client.models.list();
console.log(response.data.map((model) => model.id));

const completion = await client.chat.completions.create({
	model: "nodify",
	messages: [
		{
			role: "user",
			content: "Hello, world!",
		},
	],
});

console.log(completion.choices[0].message.content);
