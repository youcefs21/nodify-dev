export async function exportJson<T>(filename: string, out: T) {
	const jsonString = JSON.stringify(out, null, 2);
	const path = `llmBlob/${filename}.json`;
	try {
		// Write the JSON string to the specified file using Bun's write method
		await Bun.write(path, jsonString);
		console.log(`JSON data has been written to ${filename}`);
	} catch (error) {
		console.error("Error writing JSON to file:", error);
		throw error; // Rethrow the error after logging
	}
}
