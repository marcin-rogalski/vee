import { Command } from "commander";
import { createClient } from "../client";

export function makeConfigCommand(getBaseUrl: () => string): Command {
  const configCmd = new Command("config").description("manage vee configuration");

  configCmd
    .command("get")
    .description("print current server config as JSON")
    .action(async () => {
      const config = await createClient(getBaseUrl()).getConfig();
      console.log(JSON.stringify(config, null, 2));
    });

  configCmd
    .command("set <json>")
    .description("patch server config with a JSON object")
    .action(async (json: string) => {
      const partial = JSON.parse(json) as Record<string, unknown>;
      const updated = await createClient(getBaseUrl()).patchConfig(partial);
      console.log(JSON.stringify(updated, null, 2));
    });

  return configCmd;
}
