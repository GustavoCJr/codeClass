import { api } from '../../config/api'
export async function buscarCentralProfessor(correcoes) {
  const salas = await api('/classrooms/my-classes')
  if (correcoes) return { salas, itens: (await api('/submissions')).filter(item => item.status !== 'draft'), avisos: [] }
  const grupos = await Promise.allSettled(salas.map(sala => api(`/classrooms/${encodeURIComponent(sala.id)}/assignments`)))
  return {
    salas,
    itens: grupos.flatMap((grupo, i) => grupo.status === 'fulfilled' ? grupo.value.map(item => ({ ...item, sala: salas[i] })) : []),
    avisos: grupos.flatMap((grupo, i) => grupo.status === 'rejected' ? [`Não foi possível carregar ${salas[i].name}: ${grupo.reason.message}`] : [])
  }
}
