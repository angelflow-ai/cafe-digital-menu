import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { OutletProvider } from "./context/OutletContext.jsx";

createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<OutletProvider>
			<App />
		</OutletProvider>
	</React.StrictMode>
);

