export const CHAT_PAGE_SIZE = 50
export const CHAT_CONTENT_MAX = 5000
export const CHAT_EDIT_WINDOW_MS = 15 * 60 * 1000
export const CHAT_DELETED_CONTENT = '[Esta mensagem foi apagada]'

export function normalizarMensagem(item) {
  if (!item || !item.id || !item.created_at) return null
  return { ...item, content: item.is_deleted ? CHAT_DELETED_CONTENT : item.content }
}

export function mesclarMensagens(anteriores, novos) {
  const lista = new Map(anteriores.map(item => [item.id, item]))
  for (const entrada of novos) {
    const mensagem = normalizarMensagem(entrada)
    if (!mensagem) continue
    const atual = lista.get(mensagem.id)
    // Não reverte um evento mais novo ao aplicar uma resposta antiga de histórico.
    if (atual?.is_deleted && !mensagem.is_deleted) continue
    if (atual && Date.parse(atual.updated_at || atual.created_at) > Date.parse(mensagem.updated_at || mensagem.created_at)) continue
    lista.set(mensagem.id, mensagem)
  }
  return [...lista.values()].sort((a, b) => {
    const diferenca = Date.parse(a.created_at) - Date.parse(b.created_at)
    return diferenca || String(a.id).localeCompare(String(b.id))
  })
}

export function marcarMensagemExcluida(mensagens, id) {
  return mensagens.map(item => item.id === id ? { ...item, is_deleted: true, content: CHAT_DELETED_CONTENT } : item)
}

export function podeEditarMensagem(mensagem, userId, agora = Date.now()) {
  return Boolean(mensagem && !mensagem.is_deleted && mensagem.sender?.id === userId &&
    agora - Date.parse(mensagem.created_at) <= CHAT_EDIT_WINDOW_MS &&
    agora >= Date.parse(mensagem.created_at))
}

export function podeExcluirMensagem(mensagem, userId, moderador, agora = Date.now()) {
  return Boolean(mensagem && !mensagem.is_deleted && (moderador || podeEditarMensagem(mensagem, userId, agora)))
}

export function processarEventoChat(mensagens, evento, classroomId) {
  if (!evento || !evento.type) return mensagens
  if (evento.type === 'message_deleted' && evento.classroom_id === classroomId) {
    return marcarMensagemExcluida(mensagens, evento.message_id)
  }
  if (['new_message', 'message_edited'].includes(evento.type) && evento.data?.classroom_id === classroomId) {
    return mesclarMensagens(mensagens, [evento.data])
  }
  return mensagens
}
