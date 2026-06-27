import { existsSync, readFileSync, writeFileSync } from 'node:fs'

export type ReplState = {
	agentId: string | null
	sessionId: string | null
	updatedAt: string
}

export function loadReplState(filePath: string): ReplState | null {
	if (typeof filePath !== 'string' || !filePath) {
		return null
	}

	if (!existsSync(filePath)) {
		return null
	}

	try {
		const raw = readFileSync(filePath, 'utf-8')
		const parsed = JSON.parse(raw) as Record<string, unknown>

		const agentId = typeof parsed.agentId === 'string' ? parsed.agentId : null
		const sessionId =
			typeof parsed.sessionId === 'string' ? parsed.sessionId : null

		return {
			agentId,
			sessionId,
			updatedAt: new Date().toISOString(),
		}
	} catch {
		return null
	}
}

export function saveReplState(filePath: string, state: ReplState): void {
	writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8')
}
