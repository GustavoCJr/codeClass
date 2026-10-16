export function recuperarRespostas(content) {
  return Object.fromEntries((content?.answers || []).map((resposta) => [
    resposta.question_id,
    resposta.selected_option_id ?? resposta.text_answer ?? ''
  ]))
}

export function montarRespostas(questoes, respostas) {
  // Omitir questões vazias permite rascunhos parciais sem misturar os tipos.
  return {
    answers: questoes.flatMap((questao) => {
      const valor = String(respostas[questao.id] ?? '').trim()
      if (!valor) return []
      return [{
        question_id: questao.id,
        ...(questao.type === 'choice'
          ? { selected_option_id: valor }
          : { text_answer: valor })
      }]
    })
  }
}
