import { api } from '../../config/api'

export function statusAluno(atividade, submissao, agora = Date.now()) {
  if (submissao?.status === 'published') return 'published'
  if (['pending', 'awaiting_review'].includes(submissao?.status)) return submissao.status
  if (atividade.deadline && new Date(atividade.deadline).getTime() < agora) return 'late'
  return submissao?.status === 'draft' ? 'draft' : 'open'
}

export async function buscarCentralAluno() {
  const [salas, submissoes] = await Promise.all([api('/classrooms/my-classes'), api('/submissions')])
  const mapa = new Map(submissoes.map(submissao => [submissao.assignment.id, submissao]))
  const grupos = await Promise.allSettled(salas.map(sala => api(`/classrooms/${encodeURIComponent(sala.id)}/assignments`)))
  const avisos = []
  const atividades = grupos.flatMap((grupo, index) => {
    const sala = salas[index]
    if (grupo.status === 'rejected') { avisos.push(`Não foi possível carregar ${sala.name}: ${grupo.reason.message}`); return [] }
    return grupo.value.map(atividade => ({ ...atividade, sala, submissao: mapa.get(atividade.id) }))
  })
  return { salas, atividades, avisos }
}
