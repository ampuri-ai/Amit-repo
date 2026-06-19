import { useState, useRef, useCallback } from 'react'
import { api } from '../api/ipc'

export type RecordingState = 'idle' | 'recording' | 'transcribing'

export function useAudioRecorder(onTranscript: (text: string) => void) {
  const [state, setState] = useState<RecordingState>('idle')
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const start = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const arrayBuffer = await blob.arrayBuffer()
        setState('transcribing')
        try {
          const text = await api.audio.transcribe(arrayBuffer)
          if (text.trim()) onTranscript(text.trim())
        } catch (err) {
          setError((err as Error).message ?? 'Transcription failed')
        } finally {
          setState('idle')
        }
      }

      mr.start()
      mediaRecorderRef.current = mr
      setState('recording')
    } catch (err) {
      setError('Microphone access denied')
      setState('idle')
    }
  }, [onTranscript])

  const stop = useCallback(() => {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
  }, [])

  return { state, error, start, stop }
}
