import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'
import { useState } from 'react'
import type { StreamEvent } from './hooks/useStreamingChat'
import { useStreamingChat } from './hooks/useStreamingChat'

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
	const [input, setInput] = useState('')
	const { messages, streaming, submitMessage } = useStreamingChat({
		streamMessage,
		streamEvents,
	})

	useInput((_input, key) => {
		if (key.escape && input === '') {
			onBack()
		}
	})

	const handleSubmit = async (value: string) => {
		if (!sessionId || !agentId) {
			return
		}

		await submitMessage(value, sessionId, agentId)
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
