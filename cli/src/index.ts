import { Command } from "commander";
import { makeChatCommand } from "./commands/chat";
import { makeConfigCommand } from "./commands/config";

const program = new Command();

program
	.name("vee")
	.version("1.0.0")
	.option(
		"--base-url <url>",
		"base URL of the vee server",
		"http://localhost:3000",
	);

const getBaseUrl = () => (program.opts() as { baseUrl: string }).baseUrl;

program.addCommand(makeConfigCommand(getBaseUrl));
program.addCommand(makeChatCommand(getBaseUrl));

program.parse();
