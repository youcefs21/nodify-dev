import { Hono } from "hono";
import { handleFile } from "./parsers/handlers";
import { parse, Lang } from "@ast-grep/napi";
import { parseModule } from "./parsers/definitionParser";
import fs from "node:fs";

const app = new Hono();

app.get("/", (c) => c.text("Welcome to nodify!"));
app.get("/snake", (c) => c.json(handleFile("PythonQuest/snake.py")));
app.get("/snake_ast", (c) =>
	c.json(parse(Lang.Python, fs.readFileSync("PythonQuest/snake.py", "utf-8"))),
);
app.get("/snake_llm", (c) => c.text("Nothing to see yet"));
app.get("/snake_definitions", (c) =>
	c.json(
		parseModule(
			parse(
				Lang.Python,
				fs.readFileSync("PythonQuest/snake.py", "utf-8"),
			).root(),
			0,
		),
	),
);

export default app;
