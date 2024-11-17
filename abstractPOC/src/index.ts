import { Hono } from "hono";
import { parse, Lang } from "@ast-grep/napi";
import fs from "node:fs";
import { parseModule } from "./parsers/module.handler";
import { handleFile } from "./parsers/root.handler";

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
