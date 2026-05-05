import type ChatEntry from "@application/dto/ChatEntry.dto";
import type ChatContextPort from "@application/ports/ChatContext.port";
import type SessionRepositoryPort from "@application/ports/ChatSessionRepository.port";
import { get_encoding } from "tiktoken";

class RollingWindowContext implements ChatContextPort {
	private readonly enc = get_encoding("cl100k_base");
	private readonly systemEntry: ChatEntry;
	private readonly history: ChatEntry[];
	private userEntry: ChatEntry | null = null;
	private readonly currentTurn: ChatEntry[] = [];
	private _entries: ChatEntry[];

	constructor(
		private readonly sessionId: string,
		systemPrompt: string,
		history: ChatEntry[],
		private readonly tokenLimit: number,
		private readonly sessionRepository: SessionRepositoryPort,
	) {
		this.systemEntry = { author: "system", content: systemPrompt };
		this.history = [...history];
		this._entries = this.computeWindow();
	}

	get entries(): ChatEntry[] {
		return this._entries;
	}

	async push(...entries: ChatEntry[]): Promise<void> {
		for (const entry of entries) {
			await this.sessionRepository.update(this.sessionId, entry);
			this.currentTurn.push(entry);
		}
		this._entries = this.computeWindow();
	}

	startTurn(prompt: string): void {
		this.userEntry = { author: "user", content: prompt, ts: Date.now() };
		this._entries = this.computeWindow();
	}

	commitTurn(): void {
		if (this.userEntry) {
			this.history.push(this.userEntry, ...this.currentTurn);
		}
		this.userEntry = null;
		this.currentTurn.length = 0;
		this._entries = this.computeWindow();
	}

	private computeWindow(): ChatEntry[] {
		const pinnedTokens =
			this.countTokens(this.systemEntry) +
			(this.userEntry ? this.countTokens(this.userEntry) : 0) +
			this.currentTurn.reduce((sum, e) => sum + this.countTokens(e), 0);
		let budget = this.tokenLimit - pinnedTokens;

		const window: ChatEntry[] = [];
		for (let i = this.history.length - 1; i >= 0; i--) {
			const entry = this.history[i] as ChatEntry;
			const tokens = this.countTokens(entry);
			if (tokens > budget) break;
			window.unshift(entry);
			budget -= tokens;
		}

		return this.userEntry
			? [this.systemEntry, ...window, this.userEntry, ...this.currentTurn]
			: [this.systemEntry, ...window];
	}

	private countTokens(entry: ChatEntry): number {
		const text = (() => {
			switch (entry.author) {
				case "system":
				case "user":
				case "assistant":
					return entry.content;
				case "tool-call":
					return entry.name + JSON.stringify(entry.arguments);
				case "tool-result":
					return entry.result;
			}
		})();
		return this.enc.encode(text).length;
	}
}

export default RollingWindowContext;
