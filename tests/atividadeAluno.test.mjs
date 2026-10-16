import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { montarRespostas, recuperarRespostas } from '../src/pages/atividade/respostasAluno.js'
import { iniciarCodigos, validarCodigo, formatarVeredito } from '../src/pages/atividade/codigoAluno.js'

test('rascunho parcial preserva respostas abertas e alternativas na reabertura', () => {
  const questoes = [{ id: 1, type: 'choice' }, { id: 2, type: 'open' }, { id: 3, type: 'open' }]
  const content = montarRespostas(questoes, { 1: 'b', 2: ' Explicação\ncom linhas ', 3: '   ' })
  assert.deepEqual(content, { answers: [
    { question_id: 1, selected_option_id: 'b' },
    { question_id: 2, text_answer: 'Explicação\ncom linhas' }
  ] })
  assert.deepEqual(recuperarRespostas(content), { 1: 'b', 2: 'Explicação\ncom linhas' })
  assert.deepEqual(montarRespostas(questoes, {}), { answers: [] })
})

test('código salvo prevalece sobre exemplo inicial, inclusive rascunho vazio', () => {
  const linguagens = [{ name: 'python3', starter_code: 'print(0)' }, { name: 'javascript', starter_code: 'console.log(0)' }]
  assert.deepEqual(iniciarCodigos(linguagens), {
    linguagem: 'python3', codigos: { python3: 'print(0)', javascript: 'console.log(0)' }
  })
  const estado = iniciarCodigos(linguagens, { language: 'javascript', code: '  console.log(1)\n' })
  assert.equal(estado.linguagem, 'javascript')
  assert.equal(estado.codigos.javascript, '  console.log(1)\n')
  assert.equal(estado.codigos.python3, 'print(0)')
  assert.equal(iniciarCodigos(linguagens, { language: 'python3', code: '' }).codigos.python3, '')
  assert.throws(() => validarCodigo({ language: 'ruby', code: 'puts 1' }, linguagens), /linguagem permitida/)
  assert.throws(() => validarCodigo({ language: 'python3', code: ' \n ' }, linguagens), /Escreva seu código/)
  assert.doesNotThrow(() => validarCodigo({ language: 'python3', code: '' }, linguagens, true))
  assert.equal(formatarVeredito('COMPILATION_ERROR'), 'Erro de compilação')
})

test('aluno recupera apenas sua submissão e envia os contratos de draft/entrega', async () => {
  const fetchOriginal = globalThis.fetch
  globalThis.testSupabase = { auth: { getSession: async () => ({ data: { session: { access_token: 'test-token' } } }) } }
  const source = readFileSync(new URL('../src/pages/atividade/service.js', import.meta.url), 'utf8')
    .replace(/import \{ supabase \} from '[^']+'/, 'const supabase = globalThis.testSupabase')
    .replace('import.meta.env.VITE_API_URL', '"http://test.local"')
  const service = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
  const chamadas = []
  globalThis.fetch = async (url, options) => {
    const path = new URL(url).pathname
    chamadas.push({ path, options })
    assert.equal(options.headers.Authorization, 'Bearer test-token')
    return { ok: true, status: 200, json: async () =>
      path === '/api/v1/assignments/task/submissions' && !options.method
        ? [{ id: 'submission' }]
        : path === '/api/v1/submissions/submission'
          ? { content: { answers: [{ question_id: 2, text_answer: 'Salva' }] }, status: 'draft' }
          : { id: 'task' }
    }
  }
  try {
    const dados = await service.buscarAtividadeAluno('task')
    assert.equal(dados.submissao.content.answers[0].text_answer, 'Salva')
    assert.equal(chamadas.length, 3)
    assert.equal(chamadas.some(({ path }) => path.includes('/stats') || path.includes('/users/me')), false)
    const content = { answers: [{ question_id: 2, text_answer: 'Resposta aberta' }] }
    await assert.rejects(service.salvarRespostasAluno('task', content, true), /temporariamente indisponível/)
    assert.equal(chamadas.length, 3)
    await service.salvarRespostasAluno('task', { answers: [{ question_id: 1, selected_option_id: 'b' }] }, true)
    await service.salvarRespostasAluno('task', content)
    assert.equal(chamadas[3].path, '/api/v1/assignments/task/submissions/draft')
    assert.equal(chamadas[3].options.method, 'PUT')
    assert.equal(chamadas[4].options.method, 'POST')
    assert.deepEqual(JSON.parse(chamadas[4].options.body), { content })

    const codigo = { language: 'python3', code: '  print(42)\n' }
    const chamadasAntesDoTeste = chamadas.length
    await service.testarCodigoAluno('task', codigo)
    assert.equal(chamadas.length, chamadasAntesDoTeste + 1)
    assert.equal(chamadas.at(-1).path, '/api/v1/assignments/task/test-run')
    assert.equal(chamadas.at(-1).options.method, 'POST')
    assert.deepEqual(JSON.parse(chamadas.at(-1).options.body), codigo)
    await service.salvarRespostasAluno('task', codigo, true)
    assert.equal(chamadas.at(-1).path, '/api/v1/assignments/task/submissions/draft')
    assert.equal(chamadas.at(-1).options.method, 'PUT')
    assert.deepEqual(JSON.parse(chamadas.at(-1).options.body), { content: codigo })
    await service.salvarRespostasAluno('task', codigo)
    assert.equal(chamadas.at(-1).path, '/api/v1/assignments/task/submissions')
    assert.deepEqual(JSON.parse(chamadas.at(-1).options.body), { content: codigo })

    globalThis.fetch = async () => ({ ok: false, status: 503, json: async () => ({ detail: 'Executor indisponível.' }) })
    await assert.rejects(service.testarCodigoAluno('task', codigo), /Executor indisponível/)

    globalThis.fetch = async () => ({ ok: false, status: 400, json: async () => ({ detail: 'Prazo de entrega expirado.' }) })
    await assert.rejects(service.salvarRespostasAluno('task', content), /Prazo de entrega expirado/)

    globalThis.fetch = async (url) => ({ ok: true, status: 200, json: async () => url.endsWith('/submissions') ? [] : { id: 'task' } })
    assert.equal((await service.buscarAtividadeAluno('task')).submissao, null)
  } finally {
    globalThis.fetch = fetchOriginal
    delete globalThis.testSupabase
  }
})
