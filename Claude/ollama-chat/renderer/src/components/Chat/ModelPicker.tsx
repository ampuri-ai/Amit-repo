import { useEffect, useState } from 'react'
import { api } from '../../api/ipc'
import type { OllamaModel } from '../../../../shared/types'

interface ModelPickerProps {
  selected: string
  onSelect: (name: string) => void
}

export function ModelPicker({ selected, onSelect }: ModelPickerProps) {
  const [models, setModels] = useState<OllamaModel[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.ollama
      .listModels()
      .then((list) => {
        setModels(list)
        if (!selected && list[0]) onSelect(list[0].name)
      })
      .catch((err: Error) => setError(err.message))
  }, [])

  if (error) {
    return <span className="text-xs text-red-500 max-w-xs truncate" title={error}>{error}</span>
  }

  return (
    <select
      value={selected}
      onChange={(e) => onSelect(e.target.value)}
      className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white outline-none focus:border-blue-400"
    >
      {models.length === 0 && <option value="">No models found</option>}
      {models.map((m) => (
        <option key={m.name} value={m.name}>
          {m.name}
        </option>
      ))}
    </select>
  )
}
