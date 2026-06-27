import { useCallback, useRef, useState } from 'react'

/** Manages command history with up/down arrow navigation. */
export function useCommandHistory() {
	const [history, setHistory] = useState<string[]>([])
	const [currentIndex, setCurrentIndex] = useState(-1)
	const pendingInputRef = useRef('')

	const push = useCallback((command: string) => {
		if (!command.trim()) {
			return
		}
		setHistory((prev) => {
			const deduped = prev.at(-1) === command ? prev : [...prev, command]
			return deduped.slice(-100) // Keep last 100 commands
		})
		setCurrentIndex(-1)
	}, [])

	const up = useCallback((): string | null => {
		const current = currentIndex
		if (current === -1) {
			pendingInputRef.current = ''
		}
		const next = current + 1
		if (next >= history.length) {
			return null
		}
		setCurrentIndex(next)
		return history[history.length - 1 - next]
	}, [history, currentIndex])

	const down = useCallback((): string | null => {
		const current = currentIndex
		if (current <= 0) {
			setCurrentIndex(-1)
			return pendingInputRef.current || null
		}
		setCurrentIndex(current - 1)
		return history[history.length - 1 - (current - 1)]
	}, [history, currentIndex])

	const reset = useCallback(() => {
		setCurrentIndex(-1)
		pendingInputRef.current = ''
	}, [])

	return { push, up, down, reset }
}
