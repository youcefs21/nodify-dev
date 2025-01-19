import { useState, useEffect } from "react";
import { vscode } from "./utilities/vscode";
import "./App.css";

function App() {
	const [message, setMessage] = useState<string>("");

	useEffect(() => {
		// Handle messages from the extension
		const messageHandler = (event: MessageEvent) => {
			const message = event.data;
			setMessage(message);
		};

		window.addEventListener("message", messageHandler);

		// Cleanup
		return () => {
			window.removeEventListener("message", messageHandler);
		};
	}, []);

	const handleClick = () => {
		// Send a message to the extension
		vscode.postMessage({
			type: "hello",
			value: "Hello from React!",
		});
	};

	return (
		<div className="App">
			<h1>Nodify Webview</h1>
			<button type="button" onClick={handleClick}>
				Send Message to Extension
			</button>
			{message && <p>Message from extension: {message}</p>}
		</div>
	);
}

export default App;
