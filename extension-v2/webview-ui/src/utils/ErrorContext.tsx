import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { handleError } from "./errorHandling";

interface ErrorContextType {
	/**
	 * Report an error to be handled
	 */
	reportError: (error: unknown, context: string) => void;

	/**
	 * The most recent error
	 */
	lastError: {
		error: unknown;
		context: string;
		time: Date;
	} | null;

	/**
	 * Clear the last error
	 */
	clearError: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

/**
 * Provider component for error handling context
 */
export function ErrorProvider({ children }: { children: ReactNode }) {
	const [lastError, setLastError] =
		useState<ErrorContextType["lastError"]>(null);

	const reportError = (error: unknown, context: string) => {
		handleError(error, context);
		setLastError({
			error,
			context,
			time: new Date(),
		});
	};

	const clearError = () => {
		setLastError(null);
	};

	return (
		<ErrorContext.Provider
			value={{
				reportError,
				lastError,
				clearError,
			}}
		>
			{children}
		</ErrorContext.Provider>
	);
}

/**
 * Hook to use the error context
 */
export function useErrorHandling() {
	const context = useContext(ErrorContext);

	if (context === undefined) {
		throw new Error("useErrorHandling must be used within an ErrorProvider");
	}

	return context;
}
