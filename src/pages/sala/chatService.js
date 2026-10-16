/** Contrato de chat existente no FastAPI. Não consulta /users/me novamente. */
import { api } from '../../config/api'

const prefixo = (classroomId) => `/classrooms/${encodeURIComponent(classroomId)}/messages`

export function buscarMensagens(classroomId, { limit = 50, before } = {}) {
  const params = new URLSearchParams({ limit: String(limit) })
  if (before) params.set('before', before)
  return api(`${prefixo(classroomId)}?${params}`)
}

export function enviarMensagem(classroomId, content) {
  return api(prefixo(classroomId), { method: 'POST', body: JSON.stringify({ content }) })
}

export function editarMensagem(classroomId, messageId, content) {
  return api(`${prefixo(classroomId)}/${encodeURIComponent(messageId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ content })
  })
}

export function excluirMensagem(classroomId, messageId) {
  return api(`${prefixo(classroomId)}/${encodeURIComponent(messageId)}`, { method: 'DELETE' })
}
