import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@application": fileURLToPath(new URL("./src/application", import.meta.url)),
			"@domain": fileURLToPath(new URL("./src/domain", import.meta.url)),
			"@infrastructure": fileURLToPath(new URL("./src/infrastructure", import.meta.url)),
		},
	},
});
