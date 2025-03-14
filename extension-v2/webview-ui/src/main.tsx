import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ReactFlowProvider } from "@xyflow/react";

// biome-ignore lint/style/noNonNullAssertion: it is guaranteed to exist
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<ReactFlowProvider>
			<App />
		</ReactFlowProvider>
	</StrictMode>,
);
