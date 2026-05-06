import { describe, expect, it, vi } from "vitest";
import WriteFileTool from "./WriteFile.tool";

function makeFs() {
	return {
		readFile: vi.fn<() => Promise<string>>(),
		writeFile: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
		mkdir: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
	};
}

describe("WriteFileTool", () => {
	it("creates parent dirs and writes file", async () => {
		const fs = makeFs();
		const tool = new WriteFileTool(fs);

		const result = await tool.execute({ path: "/out/file.txt", content: "data" });

		expect(fs.mkdir).toHaveBeenCalledWith("/out", { recursive: true });
		expect(fs.writeFile).toHaveBeenCalledWith("/out/file.txt", "data");
		expect(result).toMatch("File written successfully");
	});

	it("returns error message on failure", async () => {
		const fs = makeFs();
		fs.writeFile.mockRejectedValue(new Error("EACCES"));
		const tool = new WriteFileTool(fs);

		const result = await tool.execute({ path: "/out/file.txt", content: "data" });

		expect(result).toMatch("Error writing file: EACCES");
	});

	it("throws on invalid args", async () => {
		const tool = new WriteFileTool(makeFs());
		await expect(tool.execute({ path: "/x" })).rejects.toThrow();
	});
});
