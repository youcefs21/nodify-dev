import * as assert from "node:assert";
import * as path from "node:path";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { getPythonExtension } from "../extension";

suite("Extension Test Suite", () => {
	vscode.window.showInformationMessage("Start all tests.");

	test("Sample test", () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test("Python Extension is installed", async () => {
		const python = await getPythonExtension();
		assert.ok(python);
	});

	test.skip("Get TextDocument", async () => {
		// Method 1: Using openTextDocument with a file path
		const filePath = path.join(__dirname, "testFile.txt");
		const doc1 = await vscode.workspace.openTextDocument(filePath);

		// Method 2: Using openTextDocument with a URI
		const uri = vscode.Uri.file(filePath);
		const doc2 = await vscode.workspace.openTextDocument(uri);

		// Method 3: For already opened documents
		const openDocs = vscode.workspace.textDocuments;

		// Method 4: Create an untitled document
		const untitledDoc = await vscode.workspace.openTextDocument({
			content: "test content",
			language: "plaintext",
		});
	});
});
