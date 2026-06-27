import { z } from 'zod'
import { ValidationError } from './errors'

export type AgentData = {
	id: string
	name: string
	description?: string
	systemPrompt: string
	providerId: string
	providerOverrides: Record<string, unknown>
	toolIds: string[]
}

export class Agent {
	static readonly schema = z.object({
		id: z.string().default(() => crypto.randomUUID()),
		name: z.string().trim().min(1),
		description: z.string().optional(),
		systemPrompt: z.string().min(1),
		providerId: z.string().trim().min(1),
		providerOverrides: z.record(z.string(), z.unknown()).default({}),
		toolIds: z.array(z.string()).default([]),
	})

	readonly id: string
	readonly providerId: string
	private _name: string
	private _description: string | undefined
	private _systemPrompt: string
	private _providerOverrides: Record<string, unknown>
	private _toolIds: string[]

	constructor(input: {
		name?: string
		systemPrompt: string
		providerId: string
		id?: string
		description?: string
		providerOverrides?: Record<string, unknown>
		toolIds?: string[]
	}) {
		try {
			const result = Agent.schema.parse(input)
			this.id = result.id
			this._name = result.name
			this._description = result.description
			this._systemPrompt = result.systemPrompt
			this.providerId = result.providerId
			this._providerOverrides = result.providerOverrides
			this._toolIds = result.toolIds
		} catch (error) {
			if (error instanceof z.ZodError) {
				const details: Record<string, string> = {}
				for (const issue of error.issues) {
					const path = issue.path.join('.')
					details[path] = issue.message
				}
				throw new ValidationError(details)
			}
			throw error
		}
	}

	get name(): string {
		return this._name
	}

	get description(): string | undefined {
		return this._description
	}

	get systemPrompt(): string {
		return this._systemPrompt
	}

	get providerOverrides(): Record<string, unknown> {
		return this._providerOverrides
	}

	get toolIds(): string[] {
		return this._toolIds
	}

	rename(newName: string): void {
		const trimmed = newName.trim()
		if (trimmed.length === 0) {
			throw new ValidationError({ name: 'Name cannot be empty' })
		}
		this._name = trimmed
	}

	setDescription(description: string | undefined): void {
		this._description = description
	}

	setSystemPrompt(prompt: string): void {
		this._systemPrompt = prompt
	}

	addTool(toolId: string): void {
		if (!this._toolIds.includes(toolId)) {
			this._toolIds.push(toolId)
		}
	}

	removeTool(toolId: string): void {
		this._toolIds = this._toolIds.filter((id) => id !== toolId)
	}

	setProviderOverrides(overrides: Record<string, unknown>): void {
		this._providerOverrides = overrides
	}

	toData(): AgentData {
		const result: AgentData = {
			id: this.id,
			name: this._name,
			systemPrompt: this._systemPrompt,
			providerId: this.providerId,
			providerOverrides: this._providerOverrides,
			toolIds: this._toolIds,
		}
		if (this._description !== undefined) {
			result.description = this._description
		}
		return result
	}
}

export default Agent
