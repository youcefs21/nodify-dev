import { useEffect, useState } from "react";
import { Progress } from "./ui/Progress";

export function LoadingScreen({ baseUrl }: { baseUrl: string }) {
	const [value, setValue] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setValue((value) => {
				// Slow down as we approach 100
				if (value >= 95) {
					return value + 0.1;
				}
				if (value >= 90) {
					return value + 0.25;
				}
				if (value >= 80) {
					return value + 0.5;
				}
				return value + 1;
			});
		}, 100);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className="flex h-screen w-full items-center justify-center flex-col gap-4">
			<img
				src={`${baseUrl}/logo.png`}
				alt="Nodify Logo"
				className="h-32 w-32 rounded-sm mb-8"
			/>
			<Progress value={Math.min(value, 100)} />
			<p className="text-sm text-muted-foreground">
				[{`${Math.min(Math.round(value), 100)}%`}] Loading...
			</p>
		</div>
	);
}
