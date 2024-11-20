import { hasReference, type inputList } from "./llm";
import { handleFile } from "./parsers/root.handler";
import { exportJson } from "./utils/exportJson";

// const out = handleFile("PythonQuest/import_test/main.py");

const flowInput = handleFile({
	rootPath: "PythonQuest/minGPT",
	currentPath: "PythonQuest/minGPT",
	fileName: "chargpt.py",
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

exportJson("ref_test", input);
