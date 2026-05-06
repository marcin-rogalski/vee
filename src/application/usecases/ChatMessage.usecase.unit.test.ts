import type ChatEntry from "@application/dto/ChatEntry.dto";
import type ChatEvent from "@application/dto/ChatEvent.dto";
import type ChatContextPort from "@application/ports/ChatContext.port";
import type ChatContextManagerPort from "@application/ports/ChatContextManager.port";
import type ChatToolManagerPort from "@application/ports/ChatToolManager.port";
import type ModelPort from "@application/ports/Model.port";
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
		getStats: vi.fn(() => ({
			sessionId: "test",
			tokensUsed: 0,
			tokenUsage: "0/4096",
			tokenPct: "0%",
		})),
		pushed,
	};
}

function fakeModel(calls: ModelEvent[][]): ModelPort {
	let i = 0;
	return {
		streamResponse: vi.fn(() => stream(...(calls[i++] ?? []))),
	} as unknown as ModelPort;
}

function fakeContextManager(ctx: ChatContextPort): ChatContextManagerPort {
	return {
		getContext: vi.fn().mockResolvedValue(ctx),
	} as unknown as ChatContextManagerPort;
}

function fakeToolManager(result = "ok"): ChatToolManagerPort {
	return {
		getTools: vi.fn().mockResolvedValue([]),
		executeTool: vi.fn().mockResolvedValue(result),
	} as unknown as ChatToolManagerPort;
}

function fakeLogger() {
	return {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	};
}

describe("ChatMessageUseCase", () => {
	it("throws when model is null", async () => {
		const useCase = new ChatMessageUseCase(
			fakeContextManager(fakeContext()),
			fakeToolManager(),
			fakeLogger(),
		);
		const gen = useCase.execute("s1", "hi", null);
		await expect(gen.next()).rejects.toThrow("No active model configured");
	});

	it("yields token events and pushes assistant message", async () => {
		const ctx = fakeContext();
		const useCase = new ChatMessageUseCase(
			fakeContextManager(ctx),
			fakeToolManager(),
			fakeLogger(),
		);
		const model = fakeModel([
			[
				{ type: "token", data: { content: "hel" } },
				{ type: "token", data: { content: "lo" } },
				{ type: "done" },
			],
		]);

		const events = [];
		for await (const e of useCase.execute("s1", "hi", model)) events.push(e);

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
			fakeContextManager(ctx),
			toolManager,
			fakeLogger(),
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
		for await (const e of useCase.execute("s1", "hi", model)) events.push(e);

		expect(toolManager.executeTool).toHaveBeenCalledWith("myTool", {});
		expect(events).toContainEqual({
			type: "tool-response",
			data: { toolCallId: "tc1", result: "tool-result" },
		});
		expect(
			(model.streamResponse as ReturnType<typeof vi.fn>).mock.calls,
		).toHaveLength(2);
		expect(ctx.commitTurn).toHaveBeenCalled();
	});
});
