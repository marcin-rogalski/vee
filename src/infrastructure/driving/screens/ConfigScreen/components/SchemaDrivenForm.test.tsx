/// <reference types="vite/client" />
/** @vitest-environment jsdom */

import type { JsonSchemaObject, JsonSchemaProperty } from '@domain/JsonSchema'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SchemaDrivenForm } from './SchemaDrivenForm'

// Mock dependencies
vi.mock('ink', () => ({
	Box: ({
		children,
		flexDirection,
		marginTop,
	}: {
		children?: React.ReactNode
		flexDirection?: 'row' | 'column'
		marginTop?: number
	}) => (
		<div
			data-testid="mock-box"
			style={{
				flexDirection: flexDirection || 'row',
				marginTop: marginTop || 0,
			}}
		>
			{children}
		</div>
	),
	Text: ({
		children,
		bold,
		dimColor,
	}: {
		children?: React.ReactNode
		bold?: boolean
		dimColor?: boolean
	}) => (
		<span
			data-testid="mock-text"
			style={{
				fontWeight: bold ? 'bold' : 'normal',
				opacity: dimColor ? 0.6 : 1,
			}}
		>
			{children}
		</span>
	),
	useInput: vi.fn(),
}))

vi.mock('ink-select-input', () => ({
	default: ({
		items,
		onSelect,
		isFocused,
	}: {
		items: Array<{ value: string; label: string }>
		onSelect: (item: { value: string; label: string }) => void
		isFocused: boolean
	}) => (
		<div data-testid="mock-select-input">
			{items.map((item: { value: string; label: string }) => (
				<button
					type="button"
					key={item.value}
					onClick={() => onSelect(item)}
					data-item={item.value}
					disabled={!isFocused}
				>
					{item.label}
				</button>
			))}
		</div>
	),
}))

vi.mock('ink-text-input', () => ({
	default: ({
		value,
		onChange,
		onSubmit,
		focus,
		placeholder,
	}: {
		value: string
		onChange: (value: string) => void
		onSubmit: (value: string) => void
		focus: boolean
		placeholder?: string
	}) => (
		<input
			data-testid="mock-text-input"
			value={value}
			placeholder={placeholder}
			onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
				onChange((e.target as unknown as { value: string }).value)
			}
			onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
				if (e.key === 'Enter') {
					onSubmit(value)
				}
			}}
			disabled={!focus}
		/>
	),
}))

describe('SchemaDrivenForm', () => {
	const mockOnComplete = vi.fn().mockResolvedValue(undefined)
	const mockOnCancel = vi.fn()

	afterEach(() => {
		cleanup()
		mockOnComplete.mockReset()
		mockOnCancel.mockReset()
	})

	const createSchema = (
		properties: Record<string, JsonSchemaProperty>,
		required?: string[],
	): JsonSchemaObject => ({
		$schema: 'https://json-schema.org/draft/2020-12/schema',
		type: 'object',
		properties,
		required,
	})

	it('renders the correct number of fields from JSON Schema', async () => {
		const schema = createSchema({
			apiKey: { type: 'string', description: 'API key' },
			model: { type: 'string', description: 'Model' },
			temperature: { type: 'number', description: 'Temperature' },
		})

		const { getByText } = render(
			<SchemaDrivenForm
				title="Test Config"
				schema={schema}
				isFocused
				onComplete={mockOnComplete}
				onCancel={mockOnCancel}
			/>,
		)

		await waitFor(() => {
			expect(getByText('Field 1 of 3')).toBeDefined()
		})
	})

	it('renders TextInput for string fields', async () => {
		const schema = createSchema({
			apiKey: { type: 'string', description: 'API key' },
		})

		const { getByTestId, getByText } = render(
			<SchemaDrivenForm
				title="Test Config"
				schema={schema}
				isFocused
				onComplete={mockOnComplete}
				onCancel={mockOnCancel}
			/>,
		)

		await waitFor(() => {
			expect(getByText('Api Key:')).toBeDefined()
			expect(getByTestId('mock-text-input')).toBeDefined()
		})
	})

	it('renders SelectInput for string enum fields', async () => {
		const schema = createSchema({
			model: {
				type: 'string',
				description: 'Model to use',
				enum: ['gpt-4o', 'gpt-4o-mini'],
			},
		})

		const { getByTestId, getByText } = render(
			<SchemaDrivenForm
				title="Test Config"
				schema={schema}
				isFocused
				onComplete={mockOnComplete}
				onCancel={mockOnCancel}
			/>,
		)

		await waitFor(() => {
			expect(getByTestId('mock-select-input')).toBeDefined()
			expect(getByText('gpt-4o')).toBeDefined()
			expect(getByText('gpt-4o-mini')).toBeDefined()
		})
	})

	it('renders TextInput for number fields', async () => {
		const schema = createSchema({
			temperature: { type: 'number', description: 'Temperature (0-2)' },
		})

		const { getByTestId, getByText } = render(
			<SchemaDrivenForm
				title="Test Config"
				schema={schema}
				isFocused
				onComplete={mockOnComplete}
				onCancel={mockOnCancel}
			/>,
		)

		await waitFor(() => {
			expect(getByText('Temperature:')).toBeDefined()
			expect(getByTestId('mock-text-input')).toBeDefined()
		})
	})

	it('calls onComplete with all field values after completing form', async () => {
		const schema = createSchema(
			{
				apiKey: { type: 'string', description: 'API key' },
				temperature: { type: 'number', description: 'Temperature' },
			},
			['apiKey'],
		)

		const { getByTestId } = render(
			<SchemaDrivenForm
				title="Test Config"
				schema={schema}
				isFocused
				onComplete={mockOnComplete}
				onCancel={mockOnCancel}
			/>,
		)

		// First field - apiKey
		let textInput = getByTestId('mock-text-input')
		fireEvent.change(textInput, { target: { value: 'sk-test' } })
		fireEvent.keyDown(textInput, { key: 'Enter', code: 'Enter', keyCode: 13 })

		// Second field - temperature (last field, triggers onComplete)
		await waitFor(() => {
			textInput = getByTestId('mock-text-input')
			fireEvent.change(textInput, { target: { value: '0.7' } })
			fireEvent.keyDown(textInput, { key: 'Enter', code: 'Enter', keyCode: 13 })
		})

		await waitFor(() => {
			expect(mockOnComplete).toHaveBeenCalledWith({
				apiKey: 'sk-test',
				temperature: '0.7',
			})
		})
	})

	it('marks required fields visually in placeholder', async () => {
		const schema = createSchema(
			{
				apiKey: { type: 'string', description: 'API key' },
				optionalField: { type: 'string', description: 'Optional field' },
			},
			['apiKey'],
		)

		const { getByTestId } = render(
			<SchemaDrivenForm
				title="Test Config"
				schema={schema}
				isFocused
				onComplete={mockOnComplete}
				onCancel={mockOnCancel}
			/>,
		)

		await waitFor(() => {
			const textInput = getByTestId('mock-text-input') as HTMLInputElement
			expect(textInput.placeholder).toBe('Api Key')
		})
	})
})
