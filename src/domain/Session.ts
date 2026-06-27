import { z } from 'zod'
import { ValidationError } from './errors'

export type SessionData = {
	id: string
	name: string
	agentId: string
	createdAt: number
	updatedAt: number
}

export class Session {
	static readonly schema = z.object({
		id: z.string().default(() => crypto.randomUUID()),
		name: z.string().default(''),
		agentId: z.string().trim().min(1),
		createdAt: z.number().default(Date.now),
		updatedAt: z.number().optional(),
	})

	readonly id: string
	readonly agentId: string
	readonly createdAt: number
	private _updatedAt: number
	private _name: string

	constructor(input: {
		name?: string
		agentId: string
		id?: string
		createdAt?: number
		updatedAt?: number
	}) {
		try {
			const result = Session.schema.parse(input)
			this.id = result.id
			this.agentId = result.agentId
			this._name = result.name
			this.createdAt = result.createdAt
			this._updatedAt = result.updatedAt ?? result.createdAt
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

	get updatedAt(): number {
		return this._updatedAt
	}

	rename(newName: string): void {
		this._name = newName
		this._updatedAt = Date.now()
	}

	toData(): SessionData {
		return {
			id: this.id,
			name: this._name,
			agentId: this.agentId,
			createdAt: this.createdAt,
			updatedAt: this._updatedAt,
		}
	}
}

export default Session
