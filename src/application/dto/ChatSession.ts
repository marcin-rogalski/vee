import type ChatEntry from "./ChatEntry.dto";

interface ChatSession {
	id: string;
	history: ChatEntry[];
}

export default ChatSession;
