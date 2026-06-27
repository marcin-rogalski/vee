import { useCallback, useRef, useState } from 'react'

/** A single line in the REPL output. */
export type ReplMessage =
	| { type: 'prompt'; content: string }
	| { type: 'response'; content: string }
	| { type: 'streaming'; content: string }
	| { type: 'error'; content: string }
	| { type: 'info'; content: string }
	| { type: 'divider' }

/** Keeps a ring buffer of REPL messages. */
export function useMessageHistory(
	maxLines: number,
	initialMessages: ReplMessage[] = [],
) {
	const [messages, setMessages] = useState<ReplMessage[]>(initialMessages)
	const maxLinesRef = useRef(maxLines)

	const push = useCallback((msg: ReplMessage) => {
		setMessages((prev) => {
			const next = [...prev, msg]
			const limit = maxLinesRef.current
			return next.length > limit ? next.slice(next.length - limit) : next
		})
	}, [])

	const clear = useCallback(() => {
		setMessages([])
	}, [])

	const updateLastStreaming = useCallback((content: string) => {
		setMessages((prev) => {
			const last = prev.at(-1)
			if (last?.type === 'streaming') {
				return [...prev.slice(0, -1), { type: 'streaming', content }]
			}
			return [...prev, { type: 'streaming', content }]
		})
	}, [])

	const finalizeStreaming = useCallback(() => {
		setMessages((prev) => {
			const last = prev.at(-1)
			if (last?.type === 'streaming') {
				return [
					...prev.slice(0, -1),
					{ type: 'response', content: last.content },
				]
			}
			return prev
		})
	}, [])

	return { messages, push, clear, updateLastStreaming, finalizeStreaming }
}
