import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ReactFlowProvider } from "@xyflow/react";
import { ErrorProvider } from "./utils/ErrorContext";

// biome-ignore lint/style/noNonNullAssertion: it is guaranteed to exist
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<ErrorProvider>
			<ReactFlowProvider>
				<App />
			</ReactFlowProvider>
		</ErrorProvider>
	</StrictMode>,
);
