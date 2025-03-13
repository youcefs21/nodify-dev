import { Effect } from "effect";

type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

export function hashString(
	input: string,
	algorithm: HashAlgorithm = "SHA-256",
) {
	return Effect.gen(function* () {
		// Convert the string to a Uint8Array
		const encoder = new TextEncoder();
		const data = encoder.encode(input);

		// Generate the hash using Web Crypto API
		const hashBuffer = yield* Effect.tryPromise(() =>
			crypto.subtle.digest(algorithm, data),
		);

		// Convert the hash to hexadecimal string
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hashHex = hashArray
			.map((byte) => byte.toString(16).padStart(2, "0"))
			.join("");

		return hashHex;
	});
}

export function getShortId(fullHash: string): string {
	// Use first 7 characters like Git does by default
	return fullHash.substring(0, 7);
}
