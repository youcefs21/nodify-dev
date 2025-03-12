import { useEffect } from "react";
import "./reactflow.css";
import { sendToServer } from "./utils/sendToServer";

function App() {
	useEffect(() => {
		sendToServer({
			type: "on-render",
		});
	}, []);

	return (
		<div className="flex flex-1 w-[calc(100vw-3rem)] h-screen overflow-hidden mocha">
			<div className="flex-grow">
				<h1>Hello World</h1>
			</div>
		</div>
	);
}

export default App;
