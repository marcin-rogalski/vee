import { Command } from "commander";
import { createClient } from "../client";

export function makeChatCommand(getBaseUrl: () => string): Command {
  const cmd = new Command("chat");
  cmd
    .description("chat with vee")
    .argument("[message]", "message to send")
    .option("--session <id>", "session id", crypto.randomUUID())
    .action(async (message: string | undefined, options: { session: string }) => {
      if (!message) {
        process.stderr.write("message argument required\n");
        process.exit(1);
      }

      const client = createClient(getBaseUrl());

      for await (const event of client.streamMessage(options.session, message)) {
        if (event.type === "token") {
          process.stdout.write(event.data.content);
        } else if (event.type === "tool-call") {
          process.stderr.write(`\n[tool: ${event.data.name}]\n`);
        } else if (event.type === "tool-response") {
          process.stderr.write(`\n[tool result: ${event.data.toolCallId}]\n`);
        } else if (event.type === "done") {
          process.stdout.write("\n");
          return;
        } else if (event.type === "error") {
          process.stderr.write(`\nError: ${JSON.stringify(event.error)}\n`);
          process.exit(1);
        }
        // thought events: ignored
      }
    });

  return cmd;
}
