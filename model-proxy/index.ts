import { Hono } from "hono";
import OpenAI from "openai";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

const app = new Hono();

// Middleware for API key authentication
app.use("*", async (c, next) => {
	const authHeader = c.req.header("Authorization");
	// const expectedKey = process.env.CUSTOM_API_KEY;
	const expectedKey = "nodify";

	if (!expectedKey) {
		return c.json(
			{
				error: {
					message: "Server configuration error: Missing API key",
					type: "auth_error",
				},
			},
			500,
		);
	}

	if (
		!authHeader ||
		!authHeader.startsWith("Bearer ") ||
		authHeader.replace("Bearer ", "") !== expectedKey
	) {
		return c.json(
			{
				error: {
					message: "Invalid API key",
					type: "auth_error",
				},
			},
			401,
		);
	}

	await next();
});

app.post("/v1/chat/completions", async (c) => {
	try {
		const body = await c.req.json();
		const proxyRequest = {
			...body,
			model: "ft:gpt-4o-mini-2024-07-18:personal:nodify:BImBzIRv:ckpt-step-584",
		};
		const response = await openai.chat.completions.create(proxyRequest);
		return c.json(response);
	} catch (error) {
		console.error("Error proxying to OpenAI:", error);
		return c.json(
			{
				error: {
					message: `Error proxying to OpenAI: ${error instanceof Error ? error.message : "Unknown error"}`,
					type: "proxy_error",
				},
			},
			500,
		);
	}
});

app.get("/v1/models", async (c) => {
	return c.json({
		object: "list",
		data: [
			{
				id: "nodify",
				object: "model",
				created: Math.floor(Date.now() / 1000),
				owned_by: "openai",
				preferred: true,
			},
		],
	});
});

export default app;
