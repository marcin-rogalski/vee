import { useEffect, useRef, useState } from 'react'

type Message = {
	role: 'user' | 'assistant'
	content: string
}

export type StreamEvent =
	| { type: 'token'; content?: string }
	| { type: 'done' }
	| { type: 'error' }

type Props = {
	streamMessage: (
		prompt: string,
		agentId: string,
		sessionId: string,
	) => Promise<void>
	streamEvents: () => AsyncGenerator<StreamEvent>
}

export function useStreamingChat({ streamMessage, streamEvents }: Props) {
	const [messages, setMessages] = useState<Message[]>([])
	const [streaming, setStreaming] = useState(false)
	const mountedRef = useRef(true)

	useEffect(() => {
		return () => {
			mountedRef.current = false
		}
	}, [])

	const submitMessage = async (
		value: string,
		sessionId: string,
		agentId: string,
	) => {
		if (!value.trim() || streaming) {
			return
		}

		setMessages((prev) => [...prev, { role: 'user', content: value }])
		setStreaming(true)

		const assistantIndex = messages.length + 1
		setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

		let accumulated = ''

		await streamMessage(value, agentId, sessionId)

		for await (const event of streamEvents()) {
			if (!mountedRef.current) {
				break
			}

			if (event.type === 'token') {
				accumulated += event.content || ''
				const captured = accumulated
				setMessages((prev) => {
					const next = [...prev]
					const entry = next[assistantIndex]
					if (entry) {
						next[assistantIndex] = { ...entry, content: captured }
					}
					return next
				})
			}

			if (event.type === 'done' || event.type === 'error') {
				break
			}
		}

		if (mountedRef.current) {
			setStreaming(false)
		}
	}

	return { messages, streaming, submitMessage }
}
