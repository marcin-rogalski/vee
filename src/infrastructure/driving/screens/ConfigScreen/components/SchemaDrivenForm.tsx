import type { JsonSchemaObject } from '@domain/JsonSchema'
import { Box, Text, useInput } from 'ink'
import SelectInput from 'ink-select-input'
import TextInput from 'ink-text-input'
import { useEffect, useMemo, useState } from 'react'
import { jsonSchemaToFormFields } from './jsonSchemaToFormFields'

type Props = {
	title: string
	schema: JsonSchemaObject
	isFocused: boolean
	/** Called with final values when all fields are completed. */
	onComplete: (values: Record<string, string>) => void
	/** Called to cancel the form. */
	onCancel?: () => void
}

export function SchemaDrivenForm({
	title,
	schema,
	isFocused,
	onComplete,
	onCancel,
}: Props) {
	const fields = useMemo(() => jsonSchemaToFormFields(schema), [schema])

	const [fieldIndex, setFieldIndex] = useState(0)
	const [values, setValues] = useState<Record<string, string>>({})
	const [currentValue, setCurrentValue] = useState('')

	const currentField = fields[fieldIndex]

	useInput(
		(_input, key) => {
			if (key.escape && onCancel) {
				onCancel()
			}
		},
		{ isActive: isFocused },
	)

	if (fields.length === 0) {
		// No fields to render — immediately complete with empty values
		useEffect(() => {
			onComplete({})
		}, [onComplete])

		return (
			<Box flexDirection="column">
				<Text bold>{title}</Text>
				<Text dimColor>No configuration needed.</Text>
			</Box>
		)
	}

	const handleValueSubmit = (value: string) => {
		if (currentField === undefined) {
			return
		}

		const newValues = { ...values, [currentField.key]: value }
		setValues(newValues)

		if (fieldIndex < fields.length - 1) {
			setCurrentValue('')
			setFieldIndex(fieldIndex + 1)
		} else {
			onComplete(newValues)
		}
	}

	const handleSelectSubmit = (item: { value: string; label: string }) => {
		handleValueSubmit(item.value)
	}

	const renderCompletedFields = () => {
		return fields.slice(0, fieldIndex).map((f) => (
			<Text key={f.key} dimColor>
				{f.label}: {values[f.key]}
			</Text>
		))
	}

	const renderCurrentField = () => {
		if (currentField === undefined) {
			return null
		}

		const placeholder = currentField.required
			? `${currentField.label}`
			: `${currentField.label} (optional)`

		if (currentField.type === 'string' && currentField.options) {
			const items = currentField.options.map((opt) => ({
				label: opt,
				value: opt,
			}))

			return (
				<SelectInput
					items={items}
					itemComponent={(item) => (
						<Box>
							<Text bold={item.isSelected ?? false}>{item.label}</Text>
						</Box>
					)}
					onSelect={handleSelectSubmit}
					isFocused={isFocused}
				/>
			)
		}

		if (currentField.type === 'boolean') {
			const items = [
				{ label: 'true', value: 'true' },
				{ label: 'false', value: 'false' },
			]

			return (
				<SelectInput
					items={items}
					itemComponent={(item) => (
						<Box>
							<Text bold={item.isSelected ?? false}>{item.label}</Text>
						</Box>
					)}
					onSelect={handleSelectSubmit}
					isFocused={isFocused}
				/>
			)
		}

		return (
			<Box>
				<Text>{currentField.label}:</Text>
				{currentField.description && (
					<Text dimColor> ({currentField.description})</Text>
				)}
				<TextInput
					value={currentValue}
					onChange={setCurrentValue}
					onSubmit={handleValueSubmit}
					focus={isFocused}
					placeholder={placeholder}
				/>
			</Box>
		)
	}

	return (
		<Box flexDirection="column" marginTop={1}>
			<Text bold>{title}</Text>
			<Text dimColor>
				Field {fieldIndex + 1} of {fields.length}
			</Text>
			<Box marginTop={1} flexDirection="column">
				{renderCompletedFields()}
				{renderCurrentField()}
			</Box>
		</Box>
	)
}
