import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { parse, compileScript } from '@vue/compiler-sfc'
import { computed, ref, watch, reactive } from 'vue'

test('formulários de edição preservam valores existentes em props reativas', () => {
  const cases = [
    ['QuestionnaireForm.vue', { questions: [{ id: 1, type: 'open', statement: 'Enunciado existente', points: 7, reference_answer: 'Referência existente', rubric: 'Rubrica existente' }] }],
    ['CodeAssignmentForm.vue', { languages: [{ name: 'javascript', starter_code: 'console.log(123)' }], time_limit_sec: 5, memory_limit_mb: 256, rubric: 'Rubrica existente', test_cases: [{ id: 1, input: 'abc', expected_output: 'xyz' }] }]
  ]
  for (const [file, config] of cases) {
    const { descriptor } = parse(readFileSync(new URL(`../src/components/assignment/${file}`, import.meta.url), 'utf8'))
    const content = compileScript(descriptor, { id: file }).content.replace(/^import .*$/gm, '').replace('export default', 'const component =')
    const Component = new Function('computed', 'ref', 'watch', 'Select', 'InputNumber', 'Textarea', 'Button', 'InputText', 'RadioButton', content + '; return component;')(computed, ref, watch, {}, {}, {}, {}, {}, {})
    let emitted
    Component.setup(reactive({ initialConfig: config }), { expose() {}, emit(event, value) { emitted = value } })
    assert.deepEqual(emitted, config)
  }
})

test('central cruza as próprias entregas e mantém salas disponíveis quando uma falha', async () => {
  globalThis.centralApi = async path => {
    if (path === '/classrooms/my-classes') return [{ id: 'a', name: 'Turma A' }, { id: 'b', name: 'Turma B' }]
    if (path === '/submissions') return [{ assignment: { id: 'task' }, status: 'published', grade: 0 }]
    if (path === '/classrooms/a/assignments') return [{ id: 'task', deadline: '2000-01-01' }, { id: 'other' }]
    throw new Error('Sem acesso')
  }
  const source = readFileSync(new URL('../src/pages/centralAluno/service.js', import.meta.url), 'utf8').replace(/import \{ api \} from '[^']+'/, 'const api = globalThis.centralApi')
  const { buscarCentralAluno, statusAluno } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
  const dados = await buscarCentralAluno()
  assert.equal(dados.atividades.length, 2)
  assert.equal(dados.avisos.length, 1)
  assert.equal(dados.atividades[0].submissao.grade, 0)
  assert.equal(statusAluno(dados.atividades[0], dados.atividades[0].submissao), 'published')
  assert.equal(statusAluno({ deadline: '2000-01-01' }, { status: 'draft' }), 'late')
  assert.equal(statusAluno({ deadline: '2000-01-01' }, { status: 'awaiting_review' }), 'awaiting_review')
  assert.equal(statusAluno({}, { status: 'draft' }), 'draft')
  assert.equal(statusAluno({}, null), 'open')
  delete globalThis.centralApi
})

test('API de gestão trata DELETE sem JSON e preserva recusas e validações do backend', async () => {
  const original = globalThis.fetch
  globalThis.managementSupabase = { auth: { getSession: async () => ({ data: { session: { access_token: 'test' } } }) } }
  const source = readFileSync(new URL('../src/config/api.js', import.meta.url), 'utf8')
    .replace(/import \{ supabase \} from '[^']+'/, 'const supabase = globalThis.managementSupabase')
    .replace('import.meta.env.VITE_API_URL', '"http://test.local"')
  const { api } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(options.method, 'DELETE')
      assert.equal(options.headers.Authorization, 'Bearer test')
      return { status: 204, json: () => { throw new Error('204 não deve ler JSON') } }
    }
    assert.equal(await api('/classrooms/room/students/student', { method: 'DELETE' }), null)
    globalThis.fetch = async () => ({ status: 400, ok: false, json: async () => ({ detail: 'Já existem submissões vinculadas.' }) })
    await assert.rejects(api('/assignments/task', { method: 'DELETE' }), /submissões vinculadas/)
    globalThis.fetch = async () => ({ status: 422, ok: false, json: async () => ({ detail: [{ msg: 'Nome inválido' }] }) })
    await assert.rejects(api('/classrooms/room', { method: 'PATCH', body: '{}' }), /Nome inválido/)
    globalThis.managementSupabase.auth.getSession = async () => ({ data: { session: null } })
    await assert.rejects(api('/submissions'), /sessão expirou/)
  } finally { globalThis.fetch = original; delete globalThis.managementSupabase }
})
