// we'll temporary use JSON to store our data, but I'm planning on moving to
// https://github.com/tursodatabase/libsql-client-ts
// when we get the chance
import type { LLMOutput } from "../types";
import fs from "node:fs/promises";
import * as vscode from "vscode";
import { hashString } from "./hash";

function getDirPath() {
	const workspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
	if (!workspace) {
		vscode.window.showErrorMessage("failed to get workspace folder");
	}

	return `${workspace}/.nodify`;
}

export async function initDB() {
	const dirPath = getDirPath();
	// make a dir if doesn't exist already
	try {
		await fs.mkdir(`${dirPath}/llm_cache`, { recursive: true });
	} catch (error) {
		vscode.window.showErrorMessage(
			`Failed to create directory: ${error instanceof Error ? error.message : error}`,
		);
	}

	// create a .gitignore with just the text content "*" in the folder if it doesn't already exist
	const gitignorePath = `${dirPath}/.gitignore`;
	try {
		const gitignoreExists = await fs
			.access(gitignorePath)
			.then(() => true)
			.catch(() => false);
		if (!gitignoreExists) {
			await fs.writeFile(gitignorePath, "*");
		}
	} catch (error) {
		vscode.window.showErrorMessage(
			`Failed to create .gitignore: ${error instanceof Error ? error.message : error}`,
		);
	}
}

export async function readLLMCacheFromAST(cleanAST: string) {
	const dirPath = getDirPath();
	const hash = await hashString(cleanAST);

	// and then read flows.json if it exists, otherwise, return an empty object
	let flows: LLMOutput[] | undefined = undefined;
	const flowsPath = `${dirPath}/llm_cache/${hash}.json`;
	try {
		const flowsExists = await fs
			.access(flowsPath)
			.then(() => true)
			.catch(() => false);

		if (flowsExists) {
			const data = await fs.readFile(flowsPath, { encoding: "utf8" });
			flows = JSON.parse(data);
		}
	} catch (error) {
		vscode.window.showErrorMessage(
			`Failed to read cache: ${error instanceof Error ? error.message : error}`,
		);
	}

	return { output: flows, cacheFilePath: flowsPath };
}

export async function readLLMCache(cacheFilePath: string) {
	try {
		const data = await fs.readFile(cacheFilePath, { encoding: "utf8" });
		return JSON.parse(data) as LLMOutput[];
	} catch (error) {
		vscode.window.showErrorMessage(
			`Failed to read cache: ${error instanceof Error ? error.message : error}`,
		);
	}
	return undefined;
}

export async function writeLLMCache(cacheFilePath: string, flows: LLMOutput[]) {
	try {
		await fs.writeFile(cacheFilePath, JSON.stringify(flows, null, 2));
	} catch (error) {
		vscode.window.showErrorMessage(
			`Failed to write cache: ${error instanceof Error ? error.message : error}`,
		);
	}
}
