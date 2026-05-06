interface FileSystemPort {
	readFile(path: string): Promise<string>;
	writeFile(path: string, content: string): Promise<void>;
	mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
}

export default FileSystemPort;
