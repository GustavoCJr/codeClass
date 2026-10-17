import { supabase } from '../../config/supabase'

const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

async function chamarMateriais(caminho, options = {}) {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session?.access_token) throw new Error('Faça login novamente para acessar os materiais.')

  const resposta = await fetch(`${apiUrl}/api/v1${caminho}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${session.access_token}`
    }
  })

  if (!resposta.ok) {
    let detalhe
    try { detalhe = (await resposta.json())?.detail } catch { /* resposta sem JSON */ }
    if (typeof detalhe === 'string') throw new Error(detalhe)
    if (Array.isArray(detalhe)) {
      const mensagem = detalhe.map((item) => item.msg).filter(Boolean).join('; ')
      if (mensagem) throw new Error(mensagem)
    }
    if (resposta.status === 413) throw new Error('O arquivo ultrapassa o limite de 30 MB.')
    if (resposta.status === 403) throw new Error('Você não tem permissão para realizar esta ação.')
    if (resposta.status === 404) throw new Error('Material ou sala não encontrado.')
    throw new Error(`Não foi possível concluir a operação (HTTP ${resposta.status}).`)
  }
  return resposta.status === 204 ? null : resposta.json()
}

function caminhoSala(classroomId) {
  if (!classroomId) throw new Error('Sala não identificada.')
  return `/classrooms/${encodeURIComponent(classroomId)}/attachments`
}

export function listarMateriais(classroomId) {
  return chamarMateriais(caminhoSala(classroomId))
}

export function enviarMaterial(classroomId, arquivo) {
  const dados = new FormData()
  dados.append('file', arquivo, arquivo.name)
  // Não definir Content-Type: o navegador cria o boundary do multipart/form-data.
  return chamarMateriais(caminhoSala(classroomId), { method: 'POST', body: dados })
}

export function obterLinkMaterial(classroomId, nomeArquivo) {
  return chamarMateriais(`${caminhoSala(classroomId)}/${encodeURIComponent(nomeArquivo)}/download`)
}

export function excluirMaterial(classroomId, nomeArquivo) {
  return chamarMateriais(`${caminhoSala(classroomId)}/${encodeURIComponent(nomeArquivo)}`, { method: 'DELETE' })
}
