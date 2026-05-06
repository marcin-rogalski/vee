import type ChatEntry from "@application/dto/ChatEntry.dto";
import type ChatEvent from "@application/dto/ChatEvent.dto";
import type ChatContextPort from "@application/ports/ChatContext.port";
import { describe, expect, it, vi } from "vitest";
import ChatMessageUseCase from "./ChatMessage.usecase";

type ModelEvent = Exclude<ChatEvent, { type: "tool-response" }>;

async function* stream(...events: ModelEvent[]) {
	for (const e of events) yield e;
}

function fakeContext(): ChatContextPort & { pushed: ChatEntry[] } {
	const pushed: ChatEntry[] = [];
	return {
		entries: [{ author: "system", content: "sys" }],
		push: vi.fn(async (...entries: ChatEntry[]) => {
			pushed.push(...entries);
		}),
		startTurn: vi.fn(),
		commitTurn: vi.fn(),
		pushed,
	};
}

function fakeModel(calls: ModelEvent[][]) {
	let i = 0;
	return { streamResponse: vi.fn(() => stream(...(calls[i++] ?? []))) };
}

function fakeContextManager(ctx: ChatContextPort) {
	return { getContext: vi.fn().mockResolvedValue(ctx) };
}

function fakeToolManager(result = "ok") {
	return {
		getTools: vi.fn().mockResolvedValue([]),
		executeTool: vi.fn().mockResolvedValue(result),
	};
}

describe("ChatMessageUseCase", () => {
	it("yields token events and pushes assistant message", async () => {
		const ctx = fakeContext();
		const useCase = new ChatMessageUseCase(
			fakeContextManager(ctx) as any,
			fakeToolManager() as any,
		);
		const model = fakeModel([
			[
				{ type: "token", data: { content: "hel" } },
				{ type: "token", data: { content: "lo" } },
				{ type: "done" },
			],
		]);

		const events = [];
		for await (const e of useCase.execute("s1", "hi", model as any))
			events.push(e);

		expect(events).toContainEqual({ type: "token", data: { content: "hel" } });
		expect(ctx.push).toHaveBeenCalledWith(
			expect.objectContaining({ author: "assistant", content: "hello" }),
		);
		expect(ctx.commitTurn).toHaveBeenCalled();
	});

	it("executes tool call and loops until done", async () => {
		const ctx = fakeContext();
		const toolManager = fakeToolManager("tool-result");
		const useCase = new ChatMessageUseCase(
			fakeContextManager(ctx) as any,
			toolManager as any,
		);
		const model = fakeModel([
			[
				{
					type: "tool-call",
					data: { id: "tc1", name: "myTool", arguments: {} },
				},
				{ type: "done" },
			],
			[{ type: "token", data: { content: "done" } }, { type: "done" }],
		]);

		const events = [];
		for await (const e of useCase.execute("s1", "hi", model as any))
			events.push(e);

		expect(toolManager.executeTool).toHaveBeenCalledWith("myTool", {});
		expect(events).toContainEqual({
			type: "tool-response",
			data: { toolCallId: "tc1", result: "tool-result" },
		});
		expect(model.streamResponse).toHaveBeenCalledTimes(2);
		expect(ctx.commitTurn).toHaveBeenCalled();
	});
});
