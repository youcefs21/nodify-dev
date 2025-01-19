import { useState, useEffect } from "react";
import { vscode } from "./utilities/vscode";
import "./App.css";

function App() {
	// TODO: type safety this
	const [flows, setFlows] = useState<any>(null);

	useEffect(() => {
		// Handle messages from the extension
		const messageHandler = (event: MessageEvent) => {
			const message = event.data; // TODO: type safety this
			if (message.type === "flows") {
				setFlows(message.value);
			}
		};

		window.addEventListener("message", messageHandler);

		// Cleanup
		return () => {
			window.removeEventListener("message", messageHandler);
		};
	}, []);

	// TODO: send all click events to the extension, including node expansion/collapse. Maybe even node hovers?
	// will be used to highlight code in the editor.
	const handleClick = () => {
		// Send a message to the extension
		vscode.postMessage({
			type: "hello",
			value: "Hello from React!",
		});
	};

	// TODO: migrate reactflow stuff here.
	return (
		<div className="App">
			<h1>Nodify Webview</h1>
			<button type="button" onClick={handleClick}>
				Send Message to Extension
			</button>
			{flows && <p>Flows: {JSON.stringify(flows)}</p>}
		</div>
	);
}

export default App;
