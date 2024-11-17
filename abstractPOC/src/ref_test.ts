import { handleFile } from "./parsers/root.handler";

const out = handleFile("PythonQuest/import_test/main.py");

console.log(JSON.stringify(out, null, 2));
