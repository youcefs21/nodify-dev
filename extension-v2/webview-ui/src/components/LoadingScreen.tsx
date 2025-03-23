import { useEffect, useState } from "react";
import { Progress } from "./ui/Progress";
import "./loader.css";

export function LoadingScreen({ baseUrl }: { baseUrl: string }) {
	const [value, setValue] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setValue((value) => {
				// Slow down as we approach 100
				if (value >= 80) {
					return value + 0.05;
				}
				if (value >= 70) {
					return value + 0.1;
				}
				if (value >= 50) {
					return value + 0.25;
				}
				return value + 0.5;
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
			<div className="loader" />
			{/* <Progress value={Math.min(value, 100)} />
			<p className="text-sm text-muted-foreground">
				[{`${Math.min(Math.round(value), 100)}%`}] Loading...
			</p> */}
		</div>
	);
}
