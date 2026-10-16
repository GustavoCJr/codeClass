import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

test('cadastro exige Admin/Owner e envia somente um aluno institucional', async () => {
  let perfil = { role: 'admin', organization_id: 'org' }
  const chamadas = []
  globalThis.testPerfil = () => perfil
  globalThis.testCadastroApi = async (path, options) => { chamadas.push({ path, options }); return [] }
  const source = readFileSync(new URL('../src/pages/alunos/service.js', import.meta.url), 'utf8')
    .replace(/import \{ api \} from '[^']+'/, 'const api = globalThis.testCadastroApi')
    .replace(/import \{ obterPerfilDaPagina \} from '[^']+'/, 'const obterPerfilDaPagina = globalThis.testPerfil')
  const { cadastrarAluno, buscarAlunos } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
  await cadastrarAluno({ full_name: ' Aluno Teste ', email: ' aluno@example.test ', password: 'synthetic-test' })
  assert.equal(chamadas[0].path, '/orgs/org/members')
  assert.equal(chamadas[0].options.method, 'POST')
  assert.deepEqual(JSON.parse(chamadas[0].options.body), { full_name: 'Aluno Teste', email: 'aluno@example.test', password: 'synthetic-test', role: 'student' })
  await buscarAlunos(' nome ', 50)
  assert.equal(new URL('http://test.local' + chamadas[1].path).searchParams.get('offset'), '50')
  perfil = { role: 'teacher', organization_id: 'org' }
  assert.throws(() => cadastrarAluno({ full_name: 'Aluno', email: 'test@example.test', password: 'synthetic' }), /Admin\/Owner/)
  assert.equal(chamadas.length, 2)
  delete globalThis.testPerfil; delete globalThis.testCadastroApi
})

test('central de correções remove drafts e preserva os estados reais de entrega', async () => {
  globalThis.testProfessorApi = async path => path === '/classrooms/my-classes'
    ? [{ id: 'room' }]
    : [{ id: 'draft', status: 'draft' }, { id: 'waiting', status: 'awaiting_review' }, { id: 'processing', status: 'pending' }, { id: 'done', status: 'published' }]
  const source = readFileSync(new URL('../src/pages/centralProfessor/service.js', import.meta.url), 'utf8')
    .replace(/import \{ api \} from '[^']+'/, 'const api = globalThis.testProfessorApi')
  const { buscarCentralProfessor } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
  assert.deepEqual((await buscarCentralProfessor(true)).itens.map(item => item.id), ['waiting', 'processing', 'done'])
  delete globalThis.testProfessorApi
})
