type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

export async function hashString(
	input: string,
	algorithm: HashAlgorithm = "SHA-256",
): Promise<string> {
	try {
		// Convert the string to a Uint8Array
		const encoder = new TextEncoder();
		const data = encoder.encode(input);

		// Generate the hash using Web Crypto API
		const hashBuffer = await crypto.subtle.digest(algorithm, data);

		// Convert the hash to hexadecimal string
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hashHex = hashArray
			.map((byte) => byte.toString(16).padStart(2, "0"))
			.join("");

		return hashHex;
	} catch (error) {
		throw new Error(
			`Failed to hash string: ${error instanceof Error ? error.message : error}`,
		);
	}
}
