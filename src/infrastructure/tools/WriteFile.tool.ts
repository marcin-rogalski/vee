import * as path from "node:path";
import type FileSystemPort from "@application/ports/FileSystem.port";
import { z } from "zod";
import Tool from "./Tool";

const argsSchema = z.object({
	path: z.string(),
	content: z.string(),
});

class WriteFileTool extends Tool {
	readonly definition = {
		name: "write_file",
		description:
			"Write content to a file at the given path. Creates the file and any missing parent directories. Returns a confirmation message.",
		parameters: {
			type: "object",
			properties: {
				path: { type: "string", description: "Path to the file to write" },
				content: {
					type: "string",
					description: "Content to write to the file",
				},
			},
			required: ["path", "content"],
		},
	};

	constructor(private readonly fs: FileSystemPort) {
		super();
	}

	async execute(raw: Record<string, unknown>): Promise<string> {
		const { path: filePath, content } = argsSchema.parse(raw);
		try {
			await this.fs.mkdir(path.dirname(filePath), { recursive: true });
			await this.fs.writeFile(filePath, content);
			return `File written successfully: ${filePath}`;
		} catch (err) {
			return `Error writing file: ${err instanceof Error ? err.message : String(err)}`;
		}
	}
}

export default WriteFileTool;
