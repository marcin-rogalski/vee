import type ContextEntryDto from '@application/dto/ContextEntry.dto'

interface ContextDto {
	readonly entries: ContextEntryDto[] // current rolling window

	push(...entries: ContextEntryDto[]): void // synchronous
	startTurn(prompt: string): void
	commitTurn(): void
}

export default ContextDto
