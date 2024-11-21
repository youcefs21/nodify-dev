// const out = handleFile("PythonQuest/import_test/main.py");

import { hasReference, runLLM, type inputList } from "../src/llm";
import { handleFile } from "../src/parsers/root.handler";
import { exportJson } from "../src/utils/exportJson";

const flowInput = handleFile({
	rootPath: "python-code/snake",
	currentPath: "python-code/snake",
	fileName: "snake.py",
});

const input: inputList = {
	input: flowInput.blocks,
	references: flowInput.scope
		.map((x, i) => ({
			refID: i,
			name: x.name,
			description: x.kind,
		}))
		.filter((ref) =>
			flowInput.blocks.some((block) => hasReference(block, ref.refID)),
		),
};

const output = await runLLM(input);

exportJson("output", output);
