type ChatEvent =
	| { type: "token"; data: { content: string } }
	| { type: "thought"; data: { content: string } }
	| { type: "tool-call"; data: { id: string; name: string; arguments: Record<string, unknown> } }
	| { type: "tool-response"; data: { toolCallId: string; result: string } }
	| { type: "done" }
	| { type: "error"; error?: unknown };

export default ChatEvent;
