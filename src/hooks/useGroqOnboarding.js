import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function useGroqOnboarding() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const [extracted, setExtracted] = useState(null)

  const sendMessage = async (userText) => {
    const newMessages = [...messages, { role: 'user', content: userText }]
    setMessages(newMessages)
    setLoading(true)
    setError(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('groq-chat', {
        body: { messages: newMessages },
      })
      if (fnError) throw fnError

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])

      if (data.done && data.extracted) {
        setDone(true)
        setExtracted(data.extracted)
      }
    } catch (err) {
      setError(err.message || 'Error de red')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setMessages([])
    setLoading(false)
    setError(null)
    setDone(false)
    setExtracted(null)
  }

  return { messages, loading, error, done, extracted, sendMessage, reset }
}
