import type ChatEntry from "@application/dto/ChatEntry.dto";

export type ContextStats = {
	sessionId: string;
	tokensUsed: number;
	tokenUsage: string;
	tokenPct: string;
	promptSnippet?: string | undefined;
	responseSnippet?: string | undefined;
};

interface ChatContextPort {
	readonly entries: ChatEntry[];
	push(...entries: ChatEntry[]): Promise<void>;
	startTurn(prompt: string): void;
	commitTurn(): void;
	getStats(): ContextStats;
}

export default ChatContextPort;
