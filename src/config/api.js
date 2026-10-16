import { supabase } from './supabase'

export async function api(caminho, options = {}) {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session) throw new Error('Sua sessão expirou. Entre novamente.')
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1${caminho}`, {
    ...options,
    headers: { Authorization: `Bearer ${session.access_token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}) }
  })
  if (response.status === 204) return null
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = body?.detail
    throw new Error(typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map(item => item.msg).join(' · ') : 'Não foi possível concluir a operação.')
  }
  return body
}
