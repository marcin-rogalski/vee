import type { AppConfig } from "@application/ports/AppConfigRepository.port";
import type ChatContextPort from "@application/ports/ChatContext.port";
import type ChatContextManagerPort from "@application/ports/ChatContextManager.port";
import type ChatSessionRepositoryPort from "@application/ports/ChatSessionRepository.port";
import RollingWindowContext from "@application/services/RollingWindowContext";

const TTL_MS = 15 * 60 * 1000;
const EVICTION_INTERVAL_MS = 60 * 1000;

type CacheEntry = { context: ChatContextPort; lastRead: number };

class ChatContextManager implements ChatContextManagerPort {
	private readonly cache = new Map<string, CacheEntry>();
	private readonly evictionTimer: ReturnType<typeof setInterval>;

	constructor(
		readonly config: AppConfig,
		readonly sessionRepository: ChatSessionRepositoryPort,
	) {
		this.evictionTimer = setInterval(() => this.evict(), EVICTION_INTERVAL_MS);

		process.on("SIGINT", this.dispose.bind(this));
		process.on("SIGTERM", this.dispose.bind(this));
	}

	async getContext(sessionId: string): Promise<ChatContextPort> {
		const cacheEntry = this.cache.get(sessionId);
		if (cacheEntry) {
			cacheEntry.lastRead = Date.now();
			return cacheEntry.context;
		}

		const session =
			(await this.sessionRepository.get(sessionId)) ??
			(await this.sessionRepository.upsert({ id: sessionId, history: [] }));
		const history = session.history;

		const context = new RollingWindowContext(
			sessionId,
			this.config.systemPrompt,
			history,
			this.config.tokenLimit,
			this.sessionRepository,
		);
		this.cache.set(sessionId, { context, lastRead: Date.now() });
		return context;
	}

	dispose(): void {
		clearInterval(this.evictionTimer);
	}

	private evict(): void {
		const now = Date.now();
		for (const [sessionId, entry] of this.cache) {
			if (now - entry.lastRead >= TTL_MS) {
				this.cache.delete(sessionId);
			}
		}
	}
}

export default ChatContextManager;
