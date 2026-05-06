import { describe, expect, it, vi } from "vitest";
import ReadFileTool from "./ReadFile.tool";

function makeFs() {
	return {
		readFile: vi.fn<() => Promise<string>>(),
		writeFile: vi.fn<() => Promise<void>>(),
		mkdir: vi.fn<() => Promise<void>>(),
	};
}

describe("ReadFileTool", () => {
	it("returns file contents on success", async () => {
		const fs = makeFs();
		fs.readFile.mockResolvedValue("hello");
		const tool = new ReadFileTool(fs);

		const result = await tool.execute({ path: "/some/file.txt" });

		expect(result).toBe("hello");
		expect(fs.readFile).toHaveBeenCalledWith("/some/file.txt");
	});

	it("returns error message on failure", async () => {
		const fs = makeFs();
		fs.readFile.mockRejectedValue(new Error("ENOENT"));
		const tool = new ReadFileTool(fs);

		const result = await tool.execute({ path: "/missing.txt" });

		expect(result).toMatch("Error reading file: ENOENT");
	});

	it("throws on invalid args", async () => {
		const tool = new ReadFileTool(makeFs());
		await expect(tool.execute({})).rejects.toThrow();
	});
});
