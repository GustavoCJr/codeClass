// Usa a situação do backend como autoridade; o prazo só subdivide tarefas pendentes.
export const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000
export const GRUPOS_TAREFAS = [
  { id: 'atrasadas', titulo: 'Atrasadas', subtitulo: 'Prazo encerrado — precisam da sua atenção', vazio: 'Nenhuma atividade atrasada.' },
  { id: 'semana', titulo: 'Próximos 7 dias', subtitulo: 'Entregas que se aproximam', vazio: 'Nenhuma atividade vence nos próximos 7 dias.' },
  { id: 'futuras', titulo: 'Mais adiante', subtitulo: 'Prazo superior a 7 dias', vazio: 'Nenhuma atividade de longo prazo.' },
  { id: 'semPrazo', titulo: 'Sem prazo definido', subtitulo: 'Atividades sem data de entrega', vazio: 'Nenhuma atividade sem prazo.' },
  { id: 'entregues', titulo: 'Entregues', subtitulo: 'Enviadas e corrigidas', vazio: 'Nenhuma atividade entregue.' }
]
export function grupoDaTarefa(item, agora = Date.now()) {
  const status = item.student_status
  if (status === 'submitted' || status === 'graded') return 'entregues'
  if (status === 'overdue') return 'atrasadas'
  const prazo = item.deadline ? Date.parse(item.deadline) : NaN
  if (!Number.isFinite(prazo)) return 'semPrazo'
  // Não recalcular atrasos: o backend é a autoridade do status.
  return prazo - agora <= SETE_DIAS_MS ? 'semana' : 'futuras'
}
export function agruparTarefas(items, agora = Date.now()) {
  const grupos = Object.fromEntries(GRUPOS_TAREFAS.map(grupo => [grupo.id, []]))
  for (const item of items) grupos[grupoDaTarefa(item, agora)].push(item)
  return GRUPOS_TAREFAS.map(grupo => ({ ...grupo, items: grupos[grupo.id] }))
}
