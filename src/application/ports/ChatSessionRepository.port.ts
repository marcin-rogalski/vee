import type ChatEntry from "@application/dto/ChatEntry.dto";
import type ChatSession from "../dto/ChatSession";

interface SessionRepositoryPort {
	create(): Promise<string>;
	get(id: string): Promise<ChatSession>;
	update(sessionId: string, message: ChatEntry): Promise<void>;
}

export default SessionRepositoryPort;
