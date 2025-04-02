/**
 * Safe data accessor for handling potentially undefined or null values
 * @param object The object to access
 * @param key The key to access
 * @param defaultValue Default value to return if the key doesn't exist
 * @returns The value at the given key or the default value
 */
export function safeGet<T, K extends keyof T>(
	object: T | null | undefined,
	key: K,
	defaultValue: T[K],
): T[K] {
	if (!object) return defaultValue;
	return object[key] !== undefined ? object[key] : defaultValue;
}

/**
 * Safely checks if an array has items
 * @param arr The array to check
 * @returns Whether the array has items
 */
export function hasItems<T>(arr: T[] | null | undefined): boolean {
	return Array.isArray(arr) && arr.length > 0;
}

/**
 * Log and handle errors in a standardized way
 * @param error The error to handle
 * @param context Additional context for the error
 */
export function handleError(error: unknown, context?: string): void {
	if (error instanceof Error) {
		console.error(
			`Error${context ? ` in ${context}` : ""}: ${error.message}`,
			error,
		);
	} else {
		console.error(`Unknown error${context ? ` in ${context}` : ""}:`, error);
	}
}

/**
 * Wrap a function with error handling
 * @param fn The function to wrap
 * @param fallback The fallback value to return if the function throws
 * @returns The wrapped function
 */
export function withErrorHandling<T, Args extends unknown[]>(
	fn: (...args: Args) => T,
	fallback: T,
	context?: string,
): (...args: Args) => T {
	return (...args: Args) => {
		try {
			return fn(...args);
		} catch (error) {
			handleError(error, context);
			return fallback;
		}
	};
}
