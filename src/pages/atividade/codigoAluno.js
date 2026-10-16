export function iniciarCodigos(linguagens, content) {
  const codigos = Object.fromEntries(linguagens.map(linguagem => [linguagem.name, linguagem.starter_code || '']))
  const linguagem = content?.language || linguagens[0]?.name || ''
  if (content && typeof content.code === 'string') codigos[linguagem] = content.code
  return { linguagem, codigos }
}

export function validarCodigo(content, linguagens, rascunho = false) {
  if (!linguagens.some(linguagem => linguagem.name === content.language)) {
    throw new Error('Selecione uma linguagem permitida para esta atividade.')
  }
  if (!rascunho && !content.code.trim()) {
    throw new Error('Escreva seu código antes de testar ou entregar.')
  }
}

export function formatarVeredito(status) {
  return {
    accepted: 'Aprovado',
    wrong_answer: 'Saída diferente da esperada',
    time_limit_exceeded: 'Tempo limite excedido',
    memory_limit_exceeded: 'Memória limite excedida',
    runtime_error: 'Erro de execução',
    compilation_error: 'Erro de compilação',
    internal_error: 'Falha no serviço de execução'
  }[String(status).toLowerCase()] || status
}
