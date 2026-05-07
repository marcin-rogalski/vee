export type ModelConfig = {
  id: string;
  type: "openai";
  apiKey: string;
  baseUrl: string;
  name: string;
  active?: true;
};

export type AppConfig = {
  systemPrompt: string;
  server: { port: number };
  mongo: { uri: string; database: string };
  tokenLimit: number;
  models: Array<ModelConfig>;
};

export type ChatEvent =
  | { type: "token"; data: { content: string } }
  | { type: "thought"; data: { content: string } }
  | { type: "tool-call"; data: { id: string; name: string; arguments: Record<string, unknown> } }
  | { type: "tool-response"; data: { toolCallId: string; result: string } }
  | { type: "done" }
  | { type: "error"; error?: unknown };

export function createClient(baseUrl: string) {
  return {
    async getConfig(): Promise<AppConfig> {
      const res = await fetch(`${baseUrl}/config`);
      return res.json() as Promise<AppConfig>;
    },

    async patchConfig(partial: Partial<AppConfig>): Promise<AppConfig> {
      const res = await fetch(`${baseUrl}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      return res.json() as Promise<AppConfig>;
    },

    async *streamMessage(session: string, message: string): AsyncGenerator<ChatEvent> {
      const res = await fetch(`${baseUrl}/${session}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last (potentially incomplete) line in the buffer
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice("data: ".length);
          const event = JSON.parse(payload) as ChatEvent;
          yield event;
          if (event.type === "done" || event.type === "error") return;
        }
      }
    },
  };
}
