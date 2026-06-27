import type { AgentData } from '@domain/Agent'
import type { JsonSchemaObject } from '@domain/JsonSchema'
import type { ProviderData } from '@domain/Provider'
import { Box, Text, useApp, useInput, useStdout } from 'ink'
import TextInput from 'ink-text-input'
import { useEffect, useRef, useState } from 'react'
import { useCommandHistory } from './hooks/useCommandHistory'
import {
	type FormStep,
	schemaToFormSteps,
	useInteractiveForm,
} from './hooks/useInteractiveForm'
import { type ReplMessage, useMessageHistory } from './hooks/useMessageHistory'

export type StreamEvent =
	| { type: 'token'; content?: string }
	| { type: 'thought'; content?: string }
	| {
			type: 'tool-call'
			toolCalls?: Array<{ name: string; arguments: string }>
	  }
	| { type: 'done' }
	| { type: 'error' }

type Props = {
	agentList: () => Promise<
		Array<Pick<AgentData, 'id' | 'name' | 'description'>>
	>
	agentUpsert: (agent: AgentData) => Promise<void>
	agentDelete: (id: string) => Promise<void>
	providerList: () => Promise<Array<Pick<ProviderData, 'id' | 'name' | 'type'>>>
	providerUpsert: (provider: ProviderData) => Promise<void>
	providerDelete: (id: string) => Promise<void>
	providerTypes: () => string[]
	providerSchema: (type: string) => JsonSchemaObject
	sessionList: () => Promise<
		Array<{ id: string; name: string; agentId: string }>
	>
	sessionCreate: (name?: string, agentId?: string) => Promise<string>
	sessionDelete: (id: string) => Promise<void>
	streamMessage: (
		prompt: string,
		agentId: string,
		sessionId: string,
	) => Promise<void>
	streamEvents: () => AsyncGenerator<StreamEvent>
	initialAgentId?: string
	initialSessionId?: string
	onStateChange?: (agentId: string | null, sessionId: string | null) => void
}

export function ReplScreen({
	agentList,
	agentUpsert,
	agentDelete,
	providerList,
	providerUpsert,
	providerDelete,
	providerTypes,
	providerSchema,
	sessionList,
	sessionCreate,
	sessionDelete,
	streamMessage,
	streamEvents,
	initialAgentId,
	initialSessionId,
	onStateChange,
}: Props) {
	const { stdout } = useStdout()
	const { exit } = useApp()

	// State
	const [input, setInput] = useState('')
	const [streaming, setStreaming] = useState(false)
	const [selectedAgentId, setSelectedAgentId] = useState<string | null>(
		initialAgentId ?? null,
	)
	const [selectedAgentName, setSelectedAgentName] = useState<string | null>(
		null,
	)
	const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
		initialSessionId ?? null,
	)

	// Interactive form
	const form = useInteractiveForm()

	// Hooks
	const {
		push: pushHistory,
		up: historyUp,
		down: historyDown,
	} = useCommandHistory()

	// Persist state changes to disk
	useEffect(() => {
		onStateChange?.(selectedAgentId, selectedSessionId)
	}, [selectedAgentId, selectedSessionId, onStateChange])

	// Restore agent name on mount from saved state
	useEffect(() => {
		if (!initialAgentId) {
			return
		}

		;(async () => {
			try {
				const agents = await agentList()
				const found = agents.find((a) => a.id === initialAgentId)
				if (found) {
					setSelectedAgentName(found.name)
				}
			} catch {
				// Agent may have been deleted since last session
			}
		})()
	}, [])
	const {
		messages,
		push: pushMessage,
		clear: clearMessages,
		updateLastStreaming,
		finalizeStreaming,
	} = useMessageHistory(stdout.rows * 2, [
		{ type: 'info', content: 'vee — AI agent REPL' },
		{ type: 'info', content: 'Type /help for available commands' },
		{ type: 'divider' },
	])

	const streamingRef = useRef(false)

	// Event consumer for streaming
	useEffect(() => {
		if (!streaming) {
			return
		}

		const events = streamEvents()
		let accumulated = ''

		;(async () => {
			for await (const event of events) {
				if (!streamingRef.current) {
					break
				}

				if (event.type === 'token') {
					accumulated += event.content || ''
					updateLastStreaming(accumulated)
				}

				if (event.type === 'thought') {
					accumulated += `\n[thinking] ${event.content || ''}\n`
					updateLastStreaming(accumulated)
				}

				if (event.type === 'tool-call' && event.toolCalls) {
					const names = event.toolCalls.map((tc) => `🔧 ${tc.name}`).join(', ')
					pushMessage({ type: 'info', content: `Tools: ${names}` })
				}

				if (event.type === 'done' || event.type === 'error') {
					break
				}
			}

			if (streamingRef.current) {
				finalizeStreaming()
				setStreaming(false)
			}
		})()
	}, [streaming])

	// Command parser
	const parseCommand = (
		raw: string,
	): {
		command: string
		args: string[]
	} => {
		const trimmed = raw.trim()
		const parts = trimmed.split(/\s+/)
		return {
			command: parts[0]?.toLowerCase() ?? '',
			args: parts.slice(1),
		}
	}

	// Command handlers
	const handleCommand = async (raw: string) => {
		const { command, args } = parseCommand(raw)

		// --- Meta commands ---
		if (command === '/quit' || command === '/exit' || command === '/q') {
			exit()
			return
		}

		if (command === '/help') {
			pushMessage({
				type: 'info',
				content: [
					'Commands:',
					'  /help              Show this help',
					'  /quit, /exit       Exit REPL',
					'  /clear             Clear screen',
					'  /status            Show current agent/session',
					'  /tools             List available tools',
					'',
					'Agents:',
					'  /agent list        List agents',
					'  /agent create      Create new agent (interactive)',
					'  /agent select <id> Select agent',
					'  /agent delete <id> Delete agent',
					'',
					'Providers:',
					'  /provider list     List providers',
					'  /provider create   Create provider (interactive)',
					'  /provider delete <id>',
					'',
					'Sessions:',
					'  /session list      List sessions',
					'  /session create    Create session',
					'  /session select <id>',
					'  /session delete <id>',
					'',
					'Plain text → send to active agent',
				].join('\n'),
			})
			return
		}

		if (command === '/clear') {
			clearMessages()
			return
		}

		if (command === '/status') {
			const lines = [
				`Agent:   ${selectedAgentName ?? 'none'}${selectedAgentId ? ` (${selectedAgentId})` : ''}`,
				`Session: ${selectedSessionId ?? 'none'}`,
			]
			pushMessage({ type: 'info', content: lines.join('\n') })
			return
		}

		if (command === '/tools') {
			pushMessage({
				type: 'info',
				content: 'Tool listing coming soon — use /agent create to assign tools',
			})
			return
		}

		// --- Agent commands ---
		if (command === '/agent') {
			await handleAgentCommand(args)
			return
		}

		// --- Provider commands ---
		if (command === '/provider') {
			await handleProviderCommand(args)
			return
		}

		// --- Session commands ---
		if (command === '/session') {
			await handleSessionCommand(args)
			return
		}

		// Unknown command
		pushMessage({ type: 'error', content: `Unknown command: ${command}` })
	}

	const handleAgentCommand = async (args: string[]) => {
		const sub = args[0]?.toLowerCase()

		if (!sub) {
			pushMessage({
				type: 'info',
				content: 'Usage: /agent list|create|select <id>|delete <id>',
			})
			return
		}

		if (sub === 'list') {
			try {
				const agents = await agentList()
				if (agents.length === 0) {
					pushMessage({ type: 'info', content: 'No agents configured' })
					return
				}
				const lines = agents.map(
					(a) =>
						`${a.id} — ${a.name}${a.description ? ` (${a.description})` : ''}${a.id === selectedAgentId ? ' ←' : ''}`,
				)
				pushMessage({ type: 'info', content: lines.join('\n') })
			} catch (err) {
				pushMessage({
					type: 'error',
					content: `Failed to list agents: ${err instanceof Error ? err.message : String(err)}`,
				})
			}
			return
		}

		if (sub === 'select') {
			const id = args[1]
			if (!id) {
				pushMessage({ type: 'info', content: 'Usage: /agent select <id>' })
				return
			}
			try {
				const agents = await agentList()
				const found = agents.find((a) => a.id === id)
				if (!found) {
					pushMessage({ type: 'error', content: `Agent not found: ${id}` })
					return
				}
				setSelectedAgentId(found.id)
				setSelectedAgentName(found.name)
				pushMessage({ type: 'info', content: `Selected agent: ${found.name}` })
			} catch (err) {
				pushMessage({
					type: 'error',
					content: `Failed to select agent: ${err instanceof Error ? err.message : String(err)}`,
				})
			}
			return
		}

		if (sub === 'delete') {
			const id = args[1]
			if (!id) {
				pushMessage({ type: 'info', content: 'Usage: /agent delete <id>' })
				return
			}
			try {
				await agentDelete(id)
				if (selectedAgentId === id) {
					setSelectedAgentId(null)
					setSelectedAgentName(null)
				}
				pushMessage({ type: 'info', content: `Deleted agent: ${id}` })
			} catch (err) {
				pushMessage({
					type: 'error',
					content: `Failed to delete agent: ${err instanceof Error ? err.message : String(err)}`,
				})
			}
			return
		}

		if (sub === 'create') {
			// Interactive agent creation form
			try {
				const providers = await providerList()
				if (providers.length === 0) {
					pushMessage({
						type: 'error',
						content: 'No providers configured. Use /provider create first.',
					})
					return
				}

				const providerOptions = providers.map((p) => `${p.id} (${p.name})`)
				const steps: FormStep[] = [
					{
						label: 'Agent name *',
						required: true,
					},
					{
						label: `Provider [${providerOptions.join(', ')}] *`,
						required: true,
						options: providers.map((p) => p.id),
					},
					{
						label: 'System prompt *',
						required: true,
					},
					{
						label: 'Description (optional)',
						required: false,
					},
				]

				pushMessage({
					type: 'info',
					content: '--- Agent creation form (Esc to cancel) ---',
				})

				form.activate(
					steps,
					async (values) => {
						const name = values['agentname']
						const providerId = values['provider']
						const systemPrompt = values['systemprompt']
						const description = values['descriptionoptional']

						if (!name || !providerId || !systemPrompt) {
							pushMessage({
								type: 'error',
								content: 'Required fields missing. Agent creation cancelled.',
							})
							return
						}

						try {
							await agentUpsert({
								id: crypto.randomUUID(),
								name,
								description: description || undefined,
								systemPrompt,
								providerId,
								providerOverrides: {},
								toolIds: [],
							})
							pushMessage({
								type: 'info',
								content: `Agent "${name}" created successfully.`,
							})
						} catch (err) {
							pushMessage({
								type: 'error',
								content: `Failed to create agent: ${err instanceof Error ? err.message : String(err)}`,
							})
						}
					},
					() => {
						pushMessage({ type: 'info', content: 'Agent creation cancelled.' })
					},
				)
			} catch (err) {
				pushMessage({
					type: 'error',
					content: `Failed to load providers: ${err instanceof Error ? err.message : String(err)}`,
				})
			}
			return
		}

		pushMessage({
			type: 'info',
			content: 'Usage: /agent list|create|select <id>|delete <id>',
		})
	}

	const handleProviderCommand = async (args: string[]) => {
		const sub = args[0]?.toLowerCase()

		if (!sub) {
			pushMessage({
				type: 'info',
				content: 'Usage: /provider list|create|delete <id>',
			})
			return
		}

		if (sub === 'list') {
			try {
				const providers = await providerList()
				if (providers.length === 0) {
					pushMessage({ type: 'info', content: 'No providers configured' })
					return
				}
				const lines = providers.map((p) => `${p.id} — ${p.name} (${p.type})`)
				pushMessage({ type: 'info', content: lines.join('\n') })
			} catch (err) {
				pushMessage({
					type: 'error',
					content: `Failed to list providers: ${err instanceof Error ? err.message : String(err)}`,
				})
			}
			return
		}

		if (sub === 'delete') {
			const id = args[1]
			if (!id) {
				pushMessage({ type: 'info', content: 'Usage: /provider delete <id>' })
				return
			}
			try {
				await providerDelete(id)
				pushMessage({ type: 'info', content: `Deleted provider: ${id}` })
			} catch (err) {
				pushMessage({
					type: 'error',
					content: `Failed to delete provider: ${err instanceof Error ? err.message : String(err)}`,
				})
			}
			return
		}

		if (sub === 'create') {
			// Interactive provider creation form
			const types = providerTypes()
			if (types.length === 0) {
				pushMessage({
					type: 'error',
					content: 'No provider types registered.',
				})
				return
			}

			// Ask for type first, then build remaining steps from schema
			const steps: FormStep[] = [
				{
					label: `Provider type [${types.join(', ')}] *`,
					required: true,
					options: types,
				},
				{
					label: 'Provider name *',
					required: true,
				},
			]

			pushMessage({
				type: 'info',
				content: '--- Provider creation form (Esc to cancel) ---',
			})

			form.activate(
				steps,
				async (values) => {
					const type = values['providertype']
					const name = values['providername']

					if (!type || !name) {
						pushMessage({
							type: 'error',
							content: 'Required fields missing. Provider creation cancelled.',
						})
						return
					}

					// Validate type
					if (!types.includes(type)) {
						pushMessage({
							type: 'error',
							content: `Unknown provider type: ${type}. Available: ${types.join(', ')}`,
						})
						return
					}

					// Get schema for this type and ask for config fields
					try {
						const schema = providerSchema(type)
						const configSteps = schemaToFormSteps(schema)

						if (configSteps.length === 0) {
							// No config fields needed
							await providerUpsert({
								id: crypto.randomUUID(),
								name,
								type,
								configSchema: schema,
								config: {},
							})
							pushMessage({
								type: 'info',
								content: `Provider "${name}" (${type}) created successfully.`,
							})
							return
						}

						// Continue with config fields
						pushMessage({
							type: 'info',
							content: `--- Config fields for ${type} ---`,
						})

						form.activate(
							configSteps,
							async (configValues) => {
								const config: Record<string, unknown> = {}
								for (const step of configSteps) {
									const key = step.label.toLowerCase().replace(/[^a-z0-9]/g, '')
									const raw = configValues[key] ?? ''
									// Try to parse as number if the schema says so
									const propDef = schema.properties?.[step.label.split(' ')[0]]
									if (
										typeof propDef === 'object' &&
										propDef?.type === 'number'
									) {
										config[step.label.split(' ')[0]] = Number(raw) || 0
									} else {
										config[step.label.split(' ')[0]] = raw
									}
								}

								await providerUpsert({
									id: crypto.randomUUID(),
									name,
									type,
									configSchema: schema,
									config,
								})
								pushMessage({
									type: 'info',
									content: `Provider "${name}" (${type}) created successfully.`,
								})
							},
							() => {
								pushMessage({
									type: 'info',
									content: 'Provider creation cancelled.',
								})
							},
						)
					} catch (err) {
						pushMessage({
							type: 'error',
							content: `Failed to get schema for ${type}: ${err instanceof Error ? err.message : String(err)}`,
						})
					}
				},
				() => {
					pushMessage({ type: 'info', content: 'Provider creation cancelled.' })
				},
			)
			return
		}

		pushMessage({
			type: 'info',
			content: 'Usage: /provider list|create|delete <id>',
		})
	}

	const handleSessionCommand = async (args: string[]) => {
		const sub = args[0]?.toLowerCase()

		if (!sub) {
			pushMessage({
				type: 'info',
				content: 'Usage: /session list|create|select <id>|delete <id>',
			})
			return
		}

		if (sub === 'list') {
			try {
				const sessions = await sessionList()
				if (sessions.length === 0) {
					pushMessage({ type: 'info', content: 'No sessions' })
					return
				}
				const lines = sessions.map(
					(s) =>
						`${s.id} — ${s.name} (agent: ${s.agentId})${s.id === selectedSessionId ? ' ←' : ''}`,
				)
				pushMessage({ type: 'info', content: lines.join('\n') })
			} catch (err) {
				pushMessage({
					type: 'error',
					content: `Failed to list sessions: ${err instanceof Error ? err.message : String(err)}`,
				})
			}
			return
		}

		if (sub === 'create') {
			const name = args[1] || 'New Session'
			try {
				const id = await sessionCreate(name, selectedAgentId || undefined)
				setSelectedSessionId(id)
				pushMessage({ type: 'info', content: `Created session: ${id}` })
			} catch (err) {
				pushMessage({
					type: 'error',
					content: `Failed to create session: ${err instanceof Error ? err.message : String(err)}`,
				})
			}
			return
		}

		if (sub === 'select') {
			const id = args[1]
			if (!id) {
				pushMessage({ type: 'info', content: 'Usage: /session select <id>' })
				return
			}
			try {
				const sessions = await sessionList()
				const found = sessions.find((s) => s.id === id)
				if (!found) {
					pushMessage({ type: 'error', content: `Session not found: ${id}` })
					return
				}
				setSelectedSessionId(found.id)
				// Also select the agent for this session
				if (found.agentId !== selectedAgentId) {
					setSelectedAgentId(found.agentId)
					const agents = await agentList()
					const agent = agents.find((a) => a.id === found.agentId)
					if (agent) {
						setSelectedAgentName(agent.name)
					}
				}
				pushMessage({
					type: 'info',
					content: `Selected session: ${found.name}`,
				})
			} catch (err) {
				pushMessage({
					type: 'error',
					content: `Failed to select session: ${err instanceof Error ? err.message : String(err)}`,
				})
			}
			return
		}

		if (sub === 'delete') {
			const id = args[1]
			if (!id) {
				pushMessage({ type: 'info', content: 'Usage: /session delete <id>' })
				return
			}
			try {
				await sessionDelete(id)
				if (selectedSessionId === id) {
					setSelectedSessionId(null)
				}
				pushMessage({ type: 'info', content: `Deleted session: ${id}` })
			} catch (err) {
				pushMessage({
					type: 'error',
					content: `Failed to delete session: ${err instanceof Error ? err.message : String(err)}`,
				})
			}
			return
		}

		pushMessage({
			type: 'info',
			content: 'Usage: /session list|create|select <id>|delete <id>',
		})
	}

	// Main submit handler
	const handleSubmit = async (value: string) => {
		// If in form mode, handle form input
		if (form.state.active) {
			form.submitValue(value)
			return
		}

		const trimmed = value.trim()
		if (!trimmed) {
			return
		}

		pushHistory(trimmed)
		pushMessage({ type: 'prompt', content: trimmed })
		setInput('')

		// Slash command?
		if (trimmed.startsWith('/')) {
			await handleCommand(trimmed)
			return
		}

		// Plain text — send to active agent
		if (!selectedAgentId) {
			pushMessage({
				type: 'error',
				content: 'No agent selected. Use /agent select <id> first.',
			})
			return
		}

		if (!selectedSessionId) {
			pushMessage({
				type: 'error',
				content:
					'No session selected. Use /session create or /session select <id> first.',
			})
			return
		}

		// Start streaming
		streamingRef.current = true
		setStreaming(true)

		await streamMessage(trimmed, selectedAgentId, selectedSessionId)

		streamingRef.current = false
	}

	// Keyboard handler
	useInput(
		(key) => {
			// Esc — cancel form
			if (key.escape && form.state.active) {
				form.cancel()
				return
			}

			// Up arrow — command history
			if (key.up) {
				const prev = historyUp()
				if (prev !== null) {
					setInput(prev)
				}
				return
			}

			// Down arrow — command history
			if (key.down) {
				const next = historyDown()
				setInput(next ?? '')
				return
			}

			// Ctrl+C — exit
			if (key.ctrl && key.c) {
				exit()
			}
		},
		{ isActive: !streaming },
	)

	// Render message history
	const renderMessage = (msg: ReplMessage, index: number) => {
		switch (msg.type) {
			case 'divider':
				return (
					<Box key={index}>
						<Text dimColor>{'─'.repeat(stdout.columns)}</Text>
					</Box>
				)

			case 'prompt':
				return (
					<Box key={index}>
						<Text bold color="cyan">
							{'> '}
						</Text>
						<Text>{msg.content}</Text>
					</Box>
				)

			case 'response':
			case 'streaming':
				return (
					<Box key={index} marginLeft={2}>
						<Text
							wrap="wrap"
							color={msg.type === 'streaming' ? 'yellow' : 'white'}
						>
							{msg.content}
						</Text>
					</Box>
				)

			case 'error':
				return (
					<Box key={index} marginLeft={2}>
						<Text color="red" wrap="wrap">
							{msg.content}
						</Text>
					</Box>
				)

			case 'info':
				return (
					<Box key={index} marginLeft={2}>
						<Text dimColor wrap="wrap">
							{msg.content}
						</Text>
					</Box>
				)
		}
	}

	return (
		<Box flexDirection="column" flexGrow={1}>
			{/* Status bar */}
			<Box>
				<Text bold>vee</Text>
				<Text> | </Text>
				<Text color="cyan">{selectedAgentName ?? 'no agent'}</Text>
				{selectedSessionId && (
					<>
						<Text> | </Text>
						<Text dimColor>{selectedSessionId.slice(0, 8)}...</Text>
					</>
				)}
				{streaming && (
					<>
						<Text> | </Text>
						<Text color="yellow">⠋</Text>
					</>
				)}
			</Box>

			{/* Message history */}
			<Box flexDirection="column" flexGrow={1} marginTop={1}>
				{messages.map(renderMessage)}
			</Box>

			{/* Input line */}
			<Box>
				<Text bold color="cyan">
					{form.state.active ? form.state.prompt : '> '}
				</Text>
				<TextInput
					value={input}
					onChange={setInput}
					onSubmit={handleSubmit}
					focus={!streaming}
					showCursor
				/>
			</Box>
		</Box>
	)
}
