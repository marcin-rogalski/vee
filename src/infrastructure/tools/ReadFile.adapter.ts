import * as os from "node:os";
import * as path from "node:path";
import type FileSystemPort from "@application/ports/FileSystem.port";
import { z } from "zod";
import Tool from "./Tool";

const argsSchema = z.object({
	path: z.string(),
});

class ReadFileTool extends Tool {
	readonly definition = {
		name: "read_file",
		description:
			"Read the contents of a file at the given path. Returns the file contents as a string.",
		parameters: {
			type: "object",
			properties: {
				path: { type: "string", description: "Path to the file to read" },
			},
			required: ["path"],
		},
	};

	constructor(private readonly fs: FileSystemPort) {
		super();
	}

	async execute(raw: Record<string, unknown>): Promise<string> {
		const { path: rawPath } = argsSchema.parse(raw);
		const resolved = rawPath.startsWith("~/")
			? path.join(os.homedir(), rawPath.slice(2))
			: rawPath;
		try {
			return await this.fs.readFile(resolved);
		} catch (err) {
			return `Error reading file: ${err instanceof Error ? err.message : String(err)}`;
		}
	}
}

export default ReadFileTool;
