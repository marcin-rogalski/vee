export type ConversationEntry = {
	id: string
	ts: number
} & (
	| { role: 'system' | 'developer'; content: string }
	| { role: 'user'; content: string }
	| {
			role: 'assistant'
			content: string
			toolCalls?: Array<{ name: string; arguments: string }>
	  }
	| { role: 'system'; name: string; content: string }
)

export function isToolResult(
	entry: ConversationEntry,
): entry is ConversationEntry & { name: string } {
	return (
		entry.role === 'system' && 'name' in entry && typeof entry.name === 'string'
	)
}
