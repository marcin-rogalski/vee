import { describe, expect, it, vi } from "vitest";
import LocalToolManager from "./LocalToolManager.adapter";
import type Tool from "./Tool";

function fakeTool(name: string, result = "ok"): Tool {
	return {
		definition: { name, description: "", parameters: {} },
		execute: vi.fn().mockResolvedValue(result),
	};
}

describe("LocalToolManager", () => {
	it("getTools returns definitions of registered tools", async () => {
		const mgr = new LocalToolManager();
		mgr.register(fakeTool("a"), fakeTool("b"));
		const tools = await mgr.getTools();
		expect(tools.map((t) => t.name)).toEqual(["a", "b"]);
	});

	it("executeTool delegates to the matching tool", async () => {
		const mgr = new LocalToolManager();
		const tool = fakeTool("my_tool", "result");
		mgr.register(tool);
		const result = await mgr.executeTool("my_tool", { x: 1 });
		expect(result).toBe("result");
		expect(tool.execute).toHaveBeenCalledWith({ x: 1 });
	});

	it("executeTool throws when tool not found", async () => {
		const mgr = new LocalToolManager();
		await expect(mgr.executeTool("missing", {})).rejects.toThrow(
			"Tool not found: missing",
		);
	});
});
