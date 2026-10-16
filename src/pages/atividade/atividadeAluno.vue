<script setup>
const props = defineProps({ embedded: { type: Boolean, default: false } })
import { computed, onMounted, onUnmounted, ref, inject } from 'vue'
import { routeLocationKey, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import SidebarLayout from 'primevue/sidebarlayout'
import SidebarMain from 'primevue/sidebarmain'
import Dialog from 'primevue/dialog'
import SidebarAluno from '../../components/sidebarAluno.vue'
import CodeEditor from '../../components/editor/CodeEditor.vue'
import { Code, File, Calendar, Clock, Play, Save, Send, Expand, Compress, CheckCircle, TimesCircle, ListCheck } from '@primeicons/vue'
import { buscarAtividadeAluno, salvarRespostasAluno, testarCodigoAluno } from './service'
import { montarRespostas, recuperarRespostas } from './respostasAluno'
import { iniciarCodigos, validarCodigo, formatarVeredito } from './codigoAluno'

const route = inject(routeLocationKey, null)
const assignmentId = route ? String(route.query.id || '') : new URLSearchParams(window.location.search).get('id')
const dados = ref(null)
const respostas = ref({})
const linguagem = ref('')
const codigos = ref({})
const codigosSalvos = ref({})
const executando = ref(false)
const resultadoTeste = ref(null)
const conteudoTestado = ref('')
const erroTeste = ref('')
const carregando = ref(true)
const erro = ref('')
const erroAcao = ref('')
const mensagem = ref('')
const salvando = ref(false)
const confirmarEntrega = ref(false)
const abaResultado = ref('casos')
const modoFoco = ref(false)
const salvo = ref('{}')
const agora = ref(Date.now())
let timer

const questoes = computed(() => dados.value?.atividade.config.questions || [])
const atividadeCodigo = computed(() => dados.value?.atividade.type === 'code')
const linguagens = computed(() => dados.value?.atividade.config.languages || [])
const codigo = computed({
  get: () => codigos.value[linguagem.value] || '',
  set: (valor) => { codigos.value[linguagem.value] = valor; mensagem.value = '' }
})
const temQuestoesAbertas = computed(() => questoes.value.some(questao => questao.type === 'open'))
const conteudo = computed(() => atividadeCodigo.value
  ? { language: linguagem.value, code: codigo.value }
  : montarRespostas(questoes.value, respostas.value))
const entregue = computed(() => ['pending', 'awaiting_review', 'published'].includes(dados.value?.submissao?.status))
const prazoEncerrado = computed(() => {
  const prazo = dados.value?.atividade.deadline
  return Boolean(prazo && new Date(prazo).getTime() < agora.value)
})
const bloqueado = computed(() => salvando.value || executando.value || entregue.value || prazoEncerrado.value)
const alterado = computed(() => JSON.stringify(conteudo.value) !== salvo.value ||
  (atividadeCodigo.value && Object.keys(codigos.value).some(nome => codigos.value[nome] !== codigosSalvos.value[nome])))
const testeDesatualizado = computed(() => resultadoTeste.value && conteudoTestado.value !== JSON.stringify(conteudo.value))
const temCasosTeste = computed(() => Boolean(dados.value?.atividade.config.test_cases?.length))
const status = computed(() => ({
  draft: 'Rascunho salvo',
  pending: 'Entrega recebida — em processamento',
  awaiting_review: 'Entrega recebida — aguardando revisão',
  published: 'Resultado publicado'
}[dados.value?.submissao?.status] || (prazoEncerrado.value ? 'Prazo encerrado' : 'Pendente')))
const linkSala = computed(() => `/sala.html?id=${encodeURIComponent(dados.value?.atividade.classroom_id || '')}&tab=atividades`)
const statusVisual = computed(() => prazoEncerrado.value && !entregue.value ? 'closed' : entregue.value ? 'submitted' : dados.value?.submissao?.status === 'draft' ? 'draft' : 'pending')
const temEnunciado = computed(() => Boolean(dados.value?.atividade.description?.trim()))

function formatarData(valor) {
  return valor ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(valor)) : 'Sem prazo'
}

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    if (!assignmentId) throw new Error('Não foi informada qual atividade deve ser aberta.')
    dados.value = await buscarAtividadeAluno(assignmentId)
    respostas.value = recuperarRespostas(dados.value.submissao?.content)
    if (atividadeCodigo.value) {
      const inicial = iniciarCodigos(linguagens.value, dados.value.submissao?.content)
      linguagem.value = inicial.linguagem
      codigos.value = inicial.codigos
      codigosSalvos.value = { ...inicial.codigos }
    }
    salvo.value = JSON.stringify(conteudo.value)
  } catch (error) {
    erro.value = error.message || 'Não foi possível carregar a atividade.'
  } finally {
    carregando.value = false
  }
}

function pedirEntrega() {
  if (bloqueado.value) return
  erroAcao.value = ''
  mensagem.value = ''
  if (atividadeCodigo.value) {
    try {
      validarCodigo(conteudo.value, linguagens.value)
    } catch (error) {
      erroAcao.value = error.message
      return
    }
  } else if (!conteudo.value.answers.length) {
    erroAcao.value = 'Responda pelo menos uma questão antes de entregar.'
    return
  }
  confirmarEntrega.value = true
}

async function salvar(rascunho) {
  if (bloqueado.value) return
  if (rascunho && !atividadeCodigo.value && temQuestoesAbertas.value) return
  erroAcao.value = ''
  mensagem.value = ''
  salvando.value = true
  try {
    if (atividadeCodigo.value) validarCodigo(conteudo.value, linguagens.value, rascunho)
    dados.value.submissao = await salvarRespostasAluno(assignmentId, conteudo.value, rascunho)
    if (atividadeCodigo.value) codigosSalvos.value[linguagem.value] = codigo.value
    salvo.value = JSON.stringify(conteudo.value)
    mensagem.value = rascunho ? 'Rascunho salvo. Você pode continuar depois.' : 'Atividade entregue com sucesso.'
  } catch (error) {
    erroAcao.value = error.message || 'Não foi possível salvar suas respostas.'
  } finally {
    salvando.value = false
    confirmarEntrega.value = false
    agora.value = Date.now()
  }
}

async function testarCodigo() {
  if (executando.value || salvando.value || !temCasosTeste.value) return
  erroTeste.value = ''
  try {
    validarCodigo(conteudo.value, linguagens.value)
    const snapshot = { ...conteudo.value }
    executando.value = true
    resultadoTeste.value = null
    resultadoTeste.value = await testarCodigoAluno(assignmentId, snapshot)
    abaResultado.value = 'casos'
    conteudoTestado.value = JSON.stringify(snapshot)
  } catch (error) {
    erroTeste.value = error.message || 'Não foi possível executar seu código.'
  } finally {
    executando.value = false
  }
}

function protegerSaida(event) {
  if (!dados.value || !alterado.value || entregue.value) return
  event.preventDefault()
  event.returnValue = ''
}

if (route) onBeforeRouteLeave(() => {
  if (dados.value && alterado.value && !entregue.value && !window.confirm('Existem alterações não salvas. Deseja sair desta atividade?')) return false
})
if (route) onBeforeRouteUpdate(() => {
  if (dados.value && alterado.value && !entregue.value && !window.confirm('Existem alterações não salvas. Deseja sair desta atividade?')) return false
})

onMounted(() => {
  carregar()
  timer = window.setInterval(() => { agora.value = Date.now() }, 1000)
  window.addEventListener('beforeunload', protegerSaida)
})
onUnmounted(() => {
  window.clearInterval(timer)
  window.removeEventListener('beforeunload', protegerSaida)
})
</script>

<template>
  <component :is="embedded ? 'div' : SidebarLayout">
    <SidebarAluno v-if="!embedded" />
    <component :is="embedded ? 'div' : SidebarMain">
      <main class="assignment-page student-assignment">
        <div v-if="carregando" class="assignment-state" aria-live="polite">Carregando atividade...</div>
        <section v-else-if="erro" class="assignment-state assignment-state--error" role="alert">
          <h1>{{ erro }}</h1>
          <button type="button" class="assignment-secondary-button" @click="carregar">Tentar novamente</button>
          <a href="/salas.html">Voltar para salas</a>
        </section>
        <template v-else-if="dados">
          <a :href="linkSala" class="assignment-back">← Voltar para a sala</a>
          <header v-if="atividadeCodigo" class="student-code-hero" aria-label="Resumo da atividade de código">
            <div class="student-code-hero-top">
              <span class="student-code-hero-type"><Code aria-hidden="true" /> ATIVIDADE DE CÓDIGO</span>
              <span class="student-code-status" :class="`student-code-status--${statusVisual}`"><span class="student-code-status-dot" aria-hidden="true"></span>{{ status }}</span>
            </div>
            <div class="student-code-hero-main">
              <div>
                <h1>{{ dados.atividade.title }}</h1>
                <p class="student-code-hero-subtitle">{{ temEnunciado ? 'Leia o enunciado e desenvolva sua solução no editor.' : 'Atividade sem descrição cadastrada. Consulte as orientações do professor antes de enviar.' }}</p>
              </div>
              <div class="student-code-hero-facts">
                <span><Calendar aria-hidden="true" /> <span><small>Prazo de entrega</small><strong>{{ formatarData(dados.atividade.deadline) }}</strong></span></span>
                <span><Code aria-hidden="true" /> <span><small>Linguagem selecionada</small><strong>{{ linguagem || 'Indisponível' }}</strong></span></span>
              </div>
            </div>
          </header>
          <header v-else class="assignment-header">
            <div class="assignment-header-copy">
              <span class="assignment-kicker">// QUESTIONÁRIO</span>
              <h1>{{ dados.atividade.title }}</h1>
              <p class="student-statement">{{ dados.atividade.description || 'Sem descrição cadastrada.' }}</p>
              <div class="assignment-header-meta">
                <span>PRAZO <strong>{{ formatarData(dados.atividade.deadline) }}</strong></span>
                <span>STATUS <strong>{{ status }}</strong></span>
              </div>
            </div>
          </header>

          <p v-if="prazoEncerrado && !entregue" class="student-assignment-notice">O prazo encerrou. As respostas salvas continuam disponíveis para consulta.</p>
          <div v-if="entregue" class="student-assignment-notice">
            <p>Entregue em {{ formatarData(dados.submissao.submitted_at) }}. {{ atividadeCodigo ? 'Seu código está disponível abaixo.' : 'Suas respostas estão disponíveis abaixo.' }}</p>
            <button type="button" class="assignment-secondary-button" :disabled="executando" @click="carregar">Atualizar status</button>
          </div>
          <p v-if="dados.submissao?.status === 'published' && dados.submissao.grade != null" class="student-assignment-notice">Nota: {{ dados.submissao.grade }}</p>
          <section v-if="dados.submissao?.status === 'published' && dados.submissao.evaluation" class="assignment-section" aria-label="Correção publicada">
            <h2>Feedback do professor</h2>
            <p class="student-statement">{{ dados.submissao.evaluation.general_feedback || 'Sem feedback geral.' }}</p>
            <article v-for="item in dados.submissao.evaluation.detailed_scores?.questions_evaluation || []" :key="item.question_id" class="student-test-case">
              <h3>Questão {{ item.question_id }}</h3><p>{{ item.awarded_points }} de {{ item.max_points }} pontos</p>
              <p v-if="item.is_correct != null">{{ item.is_correct ? 'Resposta correta' : 'Resposta incorreta' }}</p>
              <p class="student-statement">{{ item.teacher_feedback || 'Sem comentário nesta questão.' }}</p>
            </article>
          </section>

          <form v-if="dados.atividade.type === 'questionnaire'" @submit.prevent="pedirEntrega">
            <p v-if="temQuestoesAbertas && !entregue" class="student-assignment-notice">O salvamento de rascunhos com respostas abertas está temporariamente indisponível. Você pode responder e entregar normalmente; suas respostas ainda não entregues serão perdidas ao sair desta página.</p>
            <p class="student-answer-progress">{{ conteudo.answers.length }} de {{ questoes.length }} questões respondidas</p>
            <fieldset :disabled="bloqueado" class="student-question-fieldset">
              <legend class="student-form-legend">Respostas do questionário</legend>
              <div class="assignment-question-list">
                <article v-for="(questao, index) in questoes" :key="questao.id" class="assignment-question">
                  <div class="assignment-question-heading">
                    <span>QUESTÃO {{ index + 1 }}</span>
                    <span>{{ questao.points }} {{ questao.points === 1 ? 'ponto' : 'pontos' }}</span>
                  </div>
                  <h2 :id="`questao-${questao.id}`" class="student-question-title student-statement">{{ questao.statement }}</h2>
                  <div v-if="questao.type === 'choice'" role="radiogroup" :aria-labelledby="`questao-${questao.id}`" class="assignment-options">
                    <label v-for="alternativa in questao.options" :key="alternativa.id" class="assignment-option student-choice" :class="{ 'student-choice--selected': respostas[questao.id] === alternativa.id }">
                      <input v-model="respostas[questao.id]" type="radio" :name="`questao-${questao.id}`" :value="alternativa.id" @change="mensagem = ''" />
                      <span>{{ alternativa.text }}</span>
                    </label>
                  </div>
                  <textarea v-else v-model="respostas[questao.id]" :aria-labelledby="`questao-${questao.id}`" rows="6" class="student-open-answer" placeholder="Escreva sua resposta" @input="mensagem = ''"></textarea>
                </article>
              </div>
            </fieldset>
            <div v-if="!entregue" class="student-assignment-actions">
              <button type="button" class="assignment-secondary-button" :disabled="bloqueado || temQuestoesAbertas" @click="salvar(true)">{{ salvando ? 'Salvando...' : 'Salvar rascunho' }}</button>
              <button type="submit" class="student-submit-button" :disabled="bloqueado">Entregar atividade</button>
              <span v-if="alterado">Há respostas não salvas.</span>
            </div>
          </form>

          <form v-else class="assignment-section student-ide" :class="{ 'student-ide--focus': modoFoco }" @submit.prevent="pedirEntrega">
            <div class="student-ide-grid">
              <aside class="student-ide-description" aria-label="Enunciado e instruções">
                <div class="student-ide-context-header"><File aria-hidden="true" /><div><span>DESAFIO</span><h2>Enunciado</h2></div></div>
                <div class="student-ide-statement-box">
                  <p v-if="temEnunciado" class="student-statement">{{ dados.atividade.description }}</p>
                  <div v-else class="student-ide-no-statement"><File aria-hidden="true" /><strong>Sem enunciado cadastrado</strong><p>O professor ainda não adicionou uma descrição a esta atividade.</p></div>
                </div>
                <div class="student-ide-context-section">
                  <h3><ListCheck aria-hidden="true" /> Ambiente de execução</h3>
                  <div class="student-ide-limits">
                    <div><Clock aria-hidden="true" /><span>Tempo máximo</span><strong>{{ dados.atividade.config.time_limit_sec ?? '—' }} s</strong></div>
                    <div><Code aria-hidden="true" /><span>Memória</span><strong>{{ dados.atividade.config.memory_limit_mb ?? '—' }} MB</strong></div>
                    <div><ListCheck aria-hidden="true" /><span>Casos de teste</span><strong>{{ dados.atividade.config.test_cases?.length ?? 0 }}</strong></div>
                  </div>
                </div>
                <div class="student-ide-help">
                  <h3><CheckCircle aria-hidden="true" /> Antes de entregar</h3>
                  <p>Você pode executar os testes para verificar sua solução. A execução não salva o rascunho nem entrega a atividade.</p>
                </div>
              </aside>
              <section class="student-ide-workspace" aria-label="Área de programação">
                <div class="student-ide-toolbar">
                  <div class="student-ide-tab"><Code aria-hidden="true" /><span><strong>Editor de código</strong><small>Seu espaço de resolução</small></span></div>
                  <div class="student-ide-controls">
                    <label for="code-language">Linguagem</label>
                    <select id="code-language" v-model="linguagem" :disabled="bloqueado" @change="mensagem = ''">
                      <option v-if="linguagem && !linguagens.some(item => item.name === linguagem)" :value="linguagem">{{ linguagem }}</option>
                      <option v-for="item in linguagens" :key="item.name" :value="item.name">{{ item.name }}</option>
                    </select>
                    <button type="button" class="student-ide-icon-button" :aria-label="modoFoco ? 'Sair do modo foco' : 'Ampliar editor'" :title="modoFoco ? 'Sair do modo foco' : 'Ampliar editor'" @click="modoFoco = !modoFoco">
                      <Compress v-if="modoFoco" aria-hidden="true" /><Expand v-else aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <p v-if="!linguagens.length" role="alert" class="student-assignment-error">Esta atividade não possui linguagens disponíveis.</p>
                <label class="student-code-label student-visually-hidden" for="student-code">Código-fonte</label>
                <CodeEditor id="student-code" v-model="codigo" :language="linguagem" :read-only="bloqueado" :disabled="!linguagem" aria-describedby="student-code-help" />
                <p id="student-code-help" class="student-ide-caption"><CheckCircle aria-hidden="true" /> O rascunho salva a linguagem selecionada. Outros códigos ficam disponíveis apenas enquanto esta página estiver aberta.</p>
              </section>
            </div>

            <div class="student-ide-actionbar">
              <div class="student-ide-actionstatus" aria-live="polite">
                <span v-if="alterado && !entregue" class="student-ide-unsaved"><span class="student-ide-status-dot" aria-hidden="true"></span><span><strong>Alterações não salvas</strong><small>Salve seu rascunho para continuar depois</small></span></span>
                <span v-else-if="entregue" class="student-ide-ready"><CheckCircle aria-hidden="true" /><span><strong>Atividade entregue</strong><small>Código disponível para consulta</small></span></span>
                <span v-else class="student-ide-ready"><CheckCircle aria-hidden="true" /><span><strong>Editor pronto</strong><small>Escreva e teste sua solução</small></span></span>
              </div>
              <div class="student-ide-buttons">
                <button v-if="!entregue" type="button" class="assignment-secondary-button" :disabled="bloqueado || !linguagem" @click="salvar(true)"><Save aria-hidden="true" /> {{ salvando ? 'Salvando...' : 'Salvar rascunho' }}</button>
                <button type="button" class="assignment-secondary-button" :disabled="bloqueado || !temCasosTeste || !codigo.trim()" @click="testarCodigo"><Play aria-hidden="true" /> {{ executando ? 'Executando...' : 'Executar testes' }}</button>
                <button v-if="!entregue" type="submit" class="student-submit-button" :disabled="bloqueado || !linguagem"><Send aria-hidden="true" /> Entregar atividade</button>
              </div>
            </div>

            <section class="student-ide-console" aria-label="Resultados da execução" aria-live="polite">
              <div class="student-ide-console-header">
                <div class="student-ide-console-heading"><span class="student-ide-console-symbol"><Code aria-hidden="true" /></span><div><span>CONSOLE</span><h2>Resultados da execução</h2></div></div>
                <span v-if="resultadoTeste" :class="resultadoTeste.overall_status === 'ACCEPTED' ? 'student-ide-pass' : 'student-ide-fail'">
                  <CheckCircle v-if="resultadoTeste.overall_status === 'ACCEPTED'" aria-hidden="true" />
                  <TimesCircle v-else aria-hidden="true" />
                  {{ formatarVeredito(resultadoTeste.overall_status) }}
                </span>
              </div>
              <p v-if="!temCasosTeste" class="student-answer-progress">Esta atividade não possui casos de teste disponíveis.</p>
              <p v-if="executando" role="status">Executando seu código contra os casos de teste...</p>
              <p v-if="erroTeste" role="alert" class="student-assignment-error">{{ erroTeste }}</p>
              <template v-if="resultadoTeste">
                <p class="student-ide-summary">{{ resultadoTeste.passed_tests }} de {{ resultadoTeste.total_tests }} testes aprovados · Tempo total: {{ resultadoTeste.execution_time_ms }} ms</p>
                <p v-if="testeDesatualizado" class="student-assignment-notice">O código ou a linguagem mudou após este teste. Execute novamente para atualizar o resultado.</p>
                <div class="student-ide-console-tabs" role="tablist" aria-label="Visualização dos resultados">
                  <button v-for="aba in [{ id: 'casos', titulo: 'Casos de teste' }, { id: 'saida', titulo: 'Saída' }, { id: 'erros', titulo: 'Erros' }]" :key="aba.id" type="button" role="tab" :aria-selected="abaResultado === aba.id" :class="{ 'student-ide-console-tab--active': abaResultado === aba.id }" @click="abaResultado = aba.id">{{ aba.titulo }}</button>
                </div>
                <div class="student-ide-console-body" role="tabpanel">
                  <template v-if="abaResultado === 'casos'">
                    <article v-for="caso in resultadoTeste.results || []" :key="caso.test_case_id" class="student-ide-testcase">
                      <div class="student-ide-testcase-head">
                        <span>Caso {{ caso.test_case_id }}</span>
                        <span :class="caso.status === 'ACCEPTED' ? 'student-ide-pass' : 'student-ide-fail'">
                          <CheckCircle v-if="caso.status === 'ACCEPTED'" aria-hidden="true" /><TimesCircle v-else aria-hidden="true" />{{ formatarVeredito(caso.status) }}
                        </span>
                      </div>
                      <small v-if="caso.time_sec != null || caso.memory_kb != null"><span v-if="caso.time_sec != null">Tempo: {{ caso.time_sec }} s </span><span v-if="caso.memory_kb != null">· Memória: {{ caso.memory_kb }} KB</span></small>
                    </article>
                    <p v-if="!resultadoTeste.results?.length">Nenhum caso detalhado retornado.</p>
                  </template>
                  <template v-else-if="abaResultado === 'saida'">
                    <article v-for="caso in resultadoTeste.results || []" :key="caso.test_case_id" class="student-ide-output"><strong>Caso {{ caso.test_case_id }}</strong><pre>{{ caso.stdout || '(sem saída)' }}</pre></article>
                    <p v-if="!resultadoTeste.results?.length">Nenhuma saída disponível.</p>
                  </template>
                  <template v-else>
                    <article v-for="caso in (resultadoTeste.results || []).filter(c => c.stderr || c.compile_output)" :key="caso.test_case_id" class="student-ide-output">
                      <strong>Caso {{ caso.test_case_id }}</strong>
                      <div v-if="caso.stderr"><small>Erro de execução</small><pre>{{ caso.stderr }}</pre></div>
                      <div v-if="caso.compile_output"><small>Saída do compilador</small><pre>{{ caso.compile_output }}</pre></div>
                    </article>
                    <p v-if="!(resultadoTeste.results || []).some(c => c.stderr || c.compile_output)">Nenhum erro retornado pela execução.</p>
                  </template>
                </div>
              </template>
              <div v-else-if="!executando && temCasosTeste && !erroTeste" class="student-ide-empty"><span class="student-ide-empty-symbol"><Play aria-hidden="true" /></span><div><strong>Pronto para testar?</strong><p>Execute seu código para acompanhar os casos de teste, a saída e possíveis erros aqui.</p></div></div>
            </section>
          </form>
          <p v-if="erroAcao" role="alert" class="student-assignment-error">{{ erroAcao }}</p>
          <p v-if="mensagem" role="status" class="student-assignment-notice">{{ mensagem }}</p>
        </template>
      </main>

      <Dialog v-model:visible="confirmarEntrega" modal header="Entregar atividade" :closable="!salvando" :close-on-escape="!salvando" :style="{ width: 'min(92vw, 480px)' }">
        <template v-if="atividadeCodigo">
          <p>Confirme a entrega do seu código em {{ linguagem }}. Após entregar, o código ficará disponível para consulta.</p>
          <p v-if="testeDesatualizado">Seu código foi alterado após a última execução de testes.</p>
        </template>
        <template v-else>
          <p>Você respondeu {{ conteudo.answers.length }} de {{ questoes.length }} questões. Confira suas respostas antes de confirmar a entrega.</p>
          <p v-if="conteudo.answers.length < questoes.length">Há questões sem resposta.</p>
        </template>
        <template #footer>
          <button type="button" class="assignment-secondary-button" :disabled="salvando" @click="confirmarEntrega = false">Voltar às respostas</button>
          <button type="button" class="student-submit-button" :disabled="bloqueado" @click="salvar(false)">{{ salvando ? 'Entregando...' : 'Confirmar entrega' }}</button>
        </template>
      </Dialog>
    </component>
  </component>
</template>

<style src="./estilos.css"></style>
<style src="./aluno.css"></style>
