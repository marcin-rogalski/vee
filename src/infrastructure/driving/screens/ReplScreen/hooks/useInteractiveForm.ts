import type { JsonSchemaObject } from '@domain/JsonSchema'
import { useCallback, useRef, useState } from 'react'

export type FormStep = {
	/** Label shown as the prompt. */
	label: string
	/** Whether this field is required. */
	required?: boolean
	/** Default value if user presses Enter without typing. */
	defaultValue?: string
	/** Options for selection (e.g. provider types). */
	options?: string[]
}

export type InteractiveFormState = {
	/** Whether the form is currently active. */
	active: boolean
	/** Current step index. */
	stepIndex: number
	/** Collected values so far. */
	values: Record<string, string>
	/** Current step prompt text. */
	prompt: string | null
	/** Whether user can cancel with Escape. */
	cancelable: boolean
}

/**
 * Hook for step-by-step interactive forms in the REPL.
 *
 * When activated, the REPL input prompt switches to show the current
 * form question. Each Enter advances to the next step. On completion,
 * `onComplete` fires with all collected values.
 */
export function useInteractiveForm() {
	const [state, setState] = useState<InteractiveFormState>({
		active: false,
		stepIndex: 0,
		values: {},
		prompt: null,
		cancelable: true,
	})

	const stepsRef = useRef<FormStep[]>([])
	const onCompleteRef = useRef<(values: Record<string, string>) => void>(
		() => {},
	)
	const onCancelRef = useRef<() => void>(() => {})

	const activate = useCallback(
		(
			steps: FormStep[],
			onComplete: (values: Record<string, string>) => void,
			onCancel?: () => void,
		) => {
			stepsRef.current = steps
			onCompleteRef.current = onComplete
			onCancelRef.current = onCancel ?? (() => {})

			setState({
				active: true,
				stepIndex: 0,
				values: {},
				prompt: steps[0]?.label ?? null,
				cancelable: true,
			})
		},
		[],
	)

	const submitValue = useCallback((value: string) => {
		setState((prev) => {
			if (!prev.active) {
				return prev
			}

			const currentStep = stepsRef.current[prev.stepIndex]
			if (!currentStep) {
				return prev
			}

			const key = currentStep.label.toLowerCase().replace(/[^a-z0-9]/g, '')
			const newValue = value.trim() || currentStep.defaultValue || ''

			const newValues = { ...prev.values, [key]: newValue }

			if (prev.stepIndex < stepsRef.current.length - 1) {
				const nextStep = stepsRef.current[prev.stepIndex + 1]
				return {
					...prev,
					stepIndex: prev.stepIndex + 1,
					values: newValues,
					prompt: nextStep.label,
				}
			}

			// Last step — complete
			onCompleteRef.current(newValues)
			return {
				active: false,
				stepIndex: 0,
				values: {},
				prompt: null,
				cancelable: true,
			}
		})
	}, [])

	const cancel = useCallback(() => {
		onCancelRef.current()
		setState({
			active: false,
			stepIndex: 0,
			values: {},
			prompt: null,
			cancelable: true,
		})
	}, [])

	return {
		state,
		activate,
		submitValue,
		cancel,
	}
}

/**
 * Extract form fields from a provider's JSON Schema config.
 * Returns form steps for required and optional string/number fields.
 */
export function schemaToFormSteps(schema: JsonSchemaObject): FormStep[] {
	const steps: FormStep[] = []
	const props = schema.properties ?? {}
	const required = schema.required ?? []

	for (const [key, value] of Object.entries(props)) {
		if (typeof value !== 'object') {
			continue
		}

		const field = value as { type?: string; description?: string }
		const fieldType = field.type ?? 'string'

		// Only support string and number fields for now
		if (fieldType !== 'string' && fieldType !== 'number') {
			continue
		}

		steps.push({
			label: `${key}${required.includes(key) ? ' *' : ''}${field.description ? ` (${field.description})` : ''}`,
			required: required.includes(key),
			defaultValue: fieldType === 'number' ? '0' : undefined,
		})
	}

	return steps
}
