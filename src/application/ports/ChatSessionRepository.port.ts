import type ChatEntry from "@application/dto/ChatEntry.dto";
import type ChatSession from "../dto/ChatSession";

interface SessionRepositoryPort {
	upsert(session: { id?: string; history: ChatEntry[] }): Promise<ChatSession>;
	get(id: string): Promise<ChatSession | null>;
	list(): Promise<string[]>;
}

export default SessionRepositoryPort;
