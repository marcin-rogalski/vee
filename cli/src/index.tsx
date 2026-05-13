import { render } from "ink";
import React from "react";
import { App } from "./App.js";
import { createClient } from "./client.js";

const args = process.argv.slice(2);
const baseUrlIndex = args.indexOf("--base-url");
const baseUrl =
	(baseUrlIndex !== -1 ? args[baseUrlIndex + 1] : undefined) ??
	"http://localhost:3000";

const client = createClient(baseUrl);

render(<App client={client} />);
