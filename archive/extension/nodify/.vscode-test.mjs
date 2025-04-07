import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
	files: "out/test/**/*.test.js",
	workspaceFolder: "test-workspace",
	mocha: {
		timeout: 20000, // 20 seconds timeout
		ui: "tdd",
	},
	// Ensure Python extension is installed before running tests
	dependencies: ["ms-python.python"],
});
