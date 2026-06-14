import { useState } from 'react'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'removed'

interface UseMultiStepFormReturn {
	addFieldIndex: number
	addValues: Record<string, string>
	currentFieldValue: string
	setCurrentFieldValue: (v: string) => void
	saveStatus: SaveStatus
	setSaveStatus: (s: SaveStatus) => void
	reset: () => void
	onSubmit: (value: string) => 'next' | 'done'
}

export function useMultiStepForm(
	fields: readonly string[],
): UseMultiStepFormReturn {
	const [addFieldIndex, setAddFieldIndex] = useState(0)
	const [addValues, setAddValues] = useState<Record<string, string>>({})
	const [currentFieldValue, setCurrentFieldValue] = useState('')
	const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

	const reset = () => {
		setAddFieldIndex(0)
		setAddValues({})
		setCurrentFieldValue('')
	}

	const onSubmit = (value: string): 'next' | 'done' => {
		const field = fields[addFieldIndex] as string
		const newValues: Record<string, string> = {
			...addValues,
			[field]: value,
		}
		setAddValues(newValues)

		if (addFieldIndex < fields.length - 1) {
			const nextField = fields[addFieldIndex + 1] as string
			setCurrentFieldValue(newValues[nextField] ?? '')
			setAddFieldIndex(addFieldIndex + 1)
			return 'next'
		}

		return 'done'
	}

	return {
		addFieldIndex,
		addValues,
		currentFieldValue,
		setCurrentFieldValue,
		saveStatus,
		setSaveStatus,
		reset,
		onSubmit,
	}
}
