import * as fs from "node:fs/promises";
import type FileSystemPort from "@application/ports/FileSystem.port";

class NodeFileSystem implements FileSystemPort {
	readFile(filePath: string): Promise<string> {
		return fs.readFile(filePath, "utf-8");
	}

	writeFile(filePath: string, content: string): Promise<void> {
		return fs.writeFile(filePath, content, "utf-8");
	}

	async mkdir(
		dirPath: string,
		options?: { recursive?: boolean },
	): Promise<void> {
		await fs.mkdir(dirPath, options);
	}
}

export default NodeFileSystem;
