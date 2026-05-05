import type ChatEntry from "@application/dto/ChatEntry.dto";

interface ChatContextPort {
	readonly entries: ChatEntry[];
	push(...entries: ChatEntry[]): Promise<void>;
	startTurn(prompt: string): void;
	commitTurn(): void;
}

export default ChatContextPort;
