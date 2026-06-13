import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'
import { useEffect, useRef, useState } from 'react'

type Message = {
	role: 'user' | 'assistant'
	content: string
}

type StreamEvent =
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
	sessionId?: string | null
	agentId?: string | null
	onBack: () => void
}

export function ChatScreen({
	streamMessage,
	streamEvents,
	sessionId,
	agentId,
	onBack,
}: Props) {
	const [messages, setMessages] = useState<Message[]>([])
	const [input, setInput] = useState('')
	const [streaming, setStreaming] = useState(false)
	const mountedRef = useRef(true)

	useEffect(() => {
		return () => {
			mountedRef.current = false
		}
	}, [])

	useInput((_input: string, key: { escape?: boolean }) => {
		if (key.escape && input === '') {
			onBack()
		}
	})

	const handleSubmit = async (value: string) => {
		if (!value.trim() || streaming || !sessionId || !agentId) {
			return
		}

		setMessages((prev) => [...prev, { role: 'user', content: value }])
		setInput('')
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

	return (
		<Box flexDirection="column" padding={1}>
			<Text bold>Session: {sessionId}</Text>
			<Box flexDirection="column" marginTop={1}>
				{messages.map((msg, i) => (
					<Box key={i} flexDirection="column" marginBottom={1}>
						<Text bold color={msg.role === 'user' ? 'cyan' : 'green'}>
							{msg.role === 'user' ? 'You' : 'Assistant'}
						</Text>
						<Text>{msg.content}</Text>
					</Box>
				))}
			</Box>
			{streaming && <Text color="yellow">Streaming...</Text>}
			<Box marginTop={1}>
				<Text>{'> '}</Text>
				<TextInput
					value={input}
					onChange={setInput}
					onSubmit={handleSubmit}
					focus={!streaming}
				/>
			</Box>
			<Text dimColor>Esc (empty input) to go back</Text>
		</Box>
	)
}
