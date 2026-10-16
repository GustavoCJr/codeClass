/** WebSocket do chat. Eventos seguem o contrato REST/WS do FastAPI. */
import { supabase } from '../../config/supabase'

export function montarUrlChat(classroomId, token, apiUrl, origin) {
  const base = new URL(apiUrl || origin, origin)
  const pathname = `${base.pathname.replace(/\/$/, '')}/api/v1/classrooms/${encodeURIComponent(classroomId)}/chat/ws`
  const url = new URL(pathname, base.origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.searchParams.set('token', token)
  return url.toString()
}

/**
 * Mantém no máximo um socket vivo. O token é obtido do Supabase a cada tentativa.
 * O backend atual exige token na query string do handshake.
 */
export function criarConexaoChat({ classroomId, onEvent, onStatus, onOpen }) {
  let ativo = true
  let socket = null
  let timer = null
  let tentativa = 0
  let geracao = 0

  async function conectar() {
    if (!ativo) return
    const atual = ++geracao
    onStatus('connecting')

    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (!ativo || atual !== geracao) return
      if (error || !session?.access_token) {
        onStatus('auth-error')
        return
      }

      const url = montarUrlChat(classroomId, session.access_token, import.meta.env.VITE_API_URL, window.location.origin)
      const ws = new WebSocket(url)
      socket = ws

      ws.onopen = () => {
        if (!ativo || atual !== geracao) return
        const reconectou = tentativa > 0
        tentativa = 0
        onStatus('connected')
        onOpen?.(reconectou)
      }
      ws.onmessage = (evento) => {
        if (!ativo || atual !== geracao) return
        try { onEvent(JSON.parse(evento.data)) } catch { /* eventos desconhecidos são ignorados */ }
      }
      ws.onerror = () => { /* onclose faz o tratamento de reconexão */ }
      ws.onclose = (evento) => {
        if (socket === ws) socket = null
        if (!ativo || atual !== geracao) return
        // Código 1008 sinaliza rejeição de permissão/token; evita reconexões infinitas.
        if (evento.code === 1008) {
          onStatus('auth-error')
          return
        }
        tentativa += 1
        onStatus('reconnecting')
        const espera = Math.min(1000 * (2 ** Math.min(tentativa - 1, 4)), 16000)
        timer = window.setTimeout(conectar, espera)
      }
    } catch {
      if (!ativo || atual !== geracao) return
      tentativa += 1
      onStatus('reconnecting')
      timer = window.setTimeout(conectar, Math.min(1000 * (2 ** Math.min(tentativa - 1, 4)), 16000))
    }
  }

  conectar()
  return () => {
    ativo = false
    geracao += 1
    if (timer !== null) window.clearTimeout(timer)
    if (socket) {
      socket.onclose = null
      socket.onmessage = null
      socket.close(1000, 'Saiu do chat')
      socket = null
    }
  }
}
