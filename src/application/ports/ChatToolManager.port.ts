interface ChatToolManagerPort {
	getTools(): Promise<ToolDefinition[]>;
	executeTool(name: string, args: object): Promise<string>;
}

export default ChatToolManagerPort;

export type ToolDefinition = {
	name: string;
	description: string;
	parameters: Record<string, unknown>;
};
