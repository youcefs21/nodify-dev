import React, { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
		error: null,
	};

	public static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		console.error("ErrorBoundary caught an error:", error, errorInfo);
	}

	public render(): ReactNode {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}
			return (
				<div className="flex flex-col items-center justify-center p-4 border border-red rounded bg-surface-2 text-red">
					<h3 className="text-lg font-bold">Something went wrong</h3>
					<p className="text-sm">
						{this.state.error?.message || "Unknown error"}
					</p>
				</div>
			);
		}

		return this.props.children;
	}
}
