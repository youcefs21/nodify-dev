// const out = handleFile("PythonQuest/import_test/main.py");

import { hasReference, type inputList } from "../src/llm";
import { handleFile } from "../src/parsers/root.handler";
import { exportJson } from "../src/utils/exportJson";

const path = "python-code/minGPT";
const flowInput = handleFile({
	rootPath: path,
	currentPath: path,
	fileName: "chargpt.py",
});

const input: inputList = {
	input: flowInput.blocks,
	references: flowInput.scope.map((x, i) => ({
		refID: i,
		name: x.name,
		description: x.kind,
	})),
	// .filter((ref) =>
	// 	flowInput.blocks.some((block) => hasReference(block, ref.refID)),
	// ),
};

exportJson("raw", input);
