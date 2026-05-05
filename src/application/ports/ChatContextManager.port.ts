import type ChatContextPort from "@application/ports/ChatContext.port";

interface ChatContextManagerPort {
	getContext(sessionId: string): Promise<ChatContextPort>;
}

export default ChatContextManagerPort;
