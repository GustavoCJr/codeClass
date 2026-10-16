<script setup>
import { inject } from 'vue'
import { routeLocationKey, onBeforeRouteLeave } from 'vue-router'
import { useProfessorNavigation } from '../../router/professorNavigation'
const props = defineProps({ embedded: { type: Boolean, default: false } })
const route = inject(routeLocationKey, null)
const navegar = useProfessorNavigation()
import {
  computed,
  onMounted,
  ref
} from 'vue'

import SidebarLayout from 'primevue/sidebarlayout'
import SidebarMain from 'primevue/sidebarmain'

import SidebarProfessor from '../../components/sidebarProfessor.vue'
import AssignmentQuickActions from '../../components/assignment/AssignmentQuickActions.vue'
import { Book, Calendar, Clock, Users, ListCheck, FileEdit, ChartBar, Code, File, Search, Filter, SortAmountDown, CheckCircle } from '@primeicons/vue'

import { buscarPaginaAtividade } from './service'

const dados = ref(null)
const carregando = ref(true)
const erro = ref('')
const abaAtiva = ref('geral')
const pesquisaEntrega = ref('')
const filtroEntrega = ref('todas')
const ordemEntrega = ref('recentes')

function obterIdAtividade() {
  return new URLSearchParams(
    (route?.query ? new URLSearchParams(route.query).toString() : window.location.search)
  ).get('id')
}

const assignmentId = obterIdAtividade()

// Rascunhos não são entregas formais (regra do handoff).
const entregas = computed(() => (dados.value?.submissoes || [])
  .filter((submissao) => submissao.status !== 'draft'))

const statusDisponiveis = computed(() => [...new Set(entregas.value.map((item) => item.status).filter(Boolean))])

function textoNormalizado(valor) {
  return String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
}

function instante(valor) {
  const data = valor ? new Date(valor).getTime() : NaN
  return Number.isFinite(data) ? data : 0
}

const entregasVisiveis = computed(() => {
  const busca = textoNormalizado(pesquisaEntrega.value.trim())
  return entregas.value
    .filter((item) => filtroEntrega.value === 'todas' || item.status === filtroEntrega.value)
    .filter((item) => !busca || textoNormalizado(`${item.student?.full_name ?? ''} ${item.student?.email ?? ''}`).includes(busca))
    .sort((a, b) => {
      if (ordemEntrega.value === 'antigas') return instante(a.submitted_at) - instante(b.submitted_at)
      if (ordemEntrega.value === 'nome') return String(a.student?.full_name ?? '').localeCompare(String(b.student?.full_name ?? ''), 'pt-BR')
      if (ordemEntrega.value === 'nota') return (Number(b.grade) || 0) - (Number(a.grade) || 0)
      return instante(b.submitted_at) - instante(a.submitted_at)
    })
})

function limparFiltrosEntrega() {
  pesquisaEntrega.value = ''
  filtroEntrega.value = 'todas'
  ordemEntrega.value = 'recentes'
}

function classeStatusEntrega(status) {
  if (status === 'published') return 'publicado'
  if (status === 'awaiting_review') return 'revisao'
  return 'outro'
}

const prazoSituacao = computed(() => {
  const prazo = dados.value?.atividade?.deadline
  if (!prazo) return { texto: 'Sem prazo', tipo: 'sem-prazo' }
  const data = new Date(prazo)
  if (Number.isNaN(data.getTime())) return { texto: 'Sem prazo', tipo: 'sem-prazo' }
  return data.getTime() < Date.now()
    ? { texto: 'Encerrada', tipo: 'encerrada' }
    : { texto: 'Em andamento', tipo: 'andamento' }
})

function atualizarAtividade(atividade) {
  if (dados.value) dados.value.atividade = atividade
}

const totalEntregaram = computed(() => {
  return entregas.value.length
})

function formatarData(
  valor,
  comHorario = true
) {
  if (!valor) {
    return 'Sem prazo'
  }

  const options = comHorario
    ? {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    : {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }

  return new Intl.DateTimeFormat(
    'pt-BR',
    options
  ).format(new Date(valor))
}

function formatarTipo(tipo) {
  if (tipo === 'code') {
    return 'CÓDIGO'
  }

  if (tipo === 'questionnaire') {
    return 'QUESTIONÁRIO'
  }

  return String(tipo || '').toUpperCase()
}

function formatarLiberacao(valor) {
  if (valor === 'immediate') {
    return 'Imediata'
  }

  return 'Após revisão'
}

function formatarStatus(status) {
  const labels = {
    draft: 'Rascunho',
    pending: 'Pendente',
    submitted: 'Enviada',
    processing: 'Em processamento',
    graded: 'Avaliada',
    awaiting_review: 'Aguardando revisão',
    published: 'Publicado'
  }

  return labels[status] || status
}

function formatarNota(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ''
  ) {
    return '—'
  }

  const numero = Number(valor)

  if (Number.isNaN(numero)) {
    return valor
  }

  return new Intl.NumberFormat(
    'pt-BR',
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  ).format(numero)
}

function abrirEntrega(submissionId) {
  navegar(`/corrigirEntrega.html?id=${encodeURIComponent(submissionId)}`)
}

function voltarParaSala() {
  const classroomId =
    dados.value?.atividade?.classroom_id

  if (!classroomId) {
    navegar('/salas.html')
    return
  }

  navegar(`/sala.html?id=${encodeURIComponent(classroomId)}&tab=atividades`)
}

function alternativaCorreta(
  questao,
  alternativa
) {
  return questao.correct_option_id ===
    alternativa.id
}

async function carregarAtividade() {
  if (!assignmentId) {
    erro.value =
      'Não foi informado qual atividade deve ser aberta.'

    carregando.value = false
    return
  }

  carregando.value = true
  erro.value = ''

  try {
    dados.value =
      await buscarPaginaAtividade(assignmentId)
  } catch (error) {
    console.error(error)

    erro.value =
      error instanceof Error
        ? error.message
        : 'Não foi possível carregar a atividade.'
  } finally {
    carregando.value = false
  }
}

onMounted(carregarAtividade)
</script>

<template>
  <component :is="embedded ? 'div' : SidebarLayout">
    <SidebarProfessor v-if="!embedded" />

    <component :is="embedded ? 'div' : SidebarMain">
      <main class="assignment-page">
        <div
          v-if="carregando"
          class="assignment-state"
        >
          Carregando atividade...
        </div>

        <div
          v-else-if="erro"
          class="assignment-state assignment-state--error"
        >
          <span>
            // NÃO FOI POSSÍVEL ABRIR A ATIVIDADE
          </span>

          <h1>{{ erro }}</h1>

          <button type="button" class="assignment-back" @click="navegar('/salas.html')">
            Voltar para salas
          </button>
        </div>

        <template v-else-if="dados">
          <button
            type="button"
            class="assignment-back"
            @click="voltarParaSala"
          >
            ← Voltar para a sala
          </button>

          <header class="assignment-header assignment-header--enhanced">
            <div class="assignment-header-main">
              <div class="assignment-header-symbol" aria-hidden="true">
                <Code v-if="dados.atividade.type === 'code'" :size="26" />
                <File v-else :size="26" />
              </div>
              <div class="assignment-header-copy">
                <div class="assignment-header-badges">
                  <span class="assignment-type-badge">
                    {{ formatarTipo(dados.atividade.type) }}
                  </span>
                  <span class="assignment-status-badge" :class="`assignment-status-badge--${prazoSituacao.tipo}`">
                    <Clock :size="13" aria-hidden="true" />
                    {{ prazoSituacao.texto }}
                  </span>
                </div>
                <h1>{{ dados.atividade.title }}</h1>
                <p>{{ dados.atividade.description || 'Sem descrição cadastrada.' }}</p>
                <div class="assignment-header-meta assignment-header-meta--icons">
                  <div class="assignment-header-meta-item">
                    <Calendar :size="17" aria-hidden="true" />
                    <span>Prazo <strong>{{ formatarData(dados.atividade.deadline) }}</strong></span>
                  </div>
                  <div class="assignment-header-meta-item">
                    <Book :size="17" aria-hidden="true" />
                    <span>Liberação do resultado <strong>{{ formatarLiberacao(dados.atividade.release_policy) }}</strong></span>
                  </div>
                </div>
              </div>
            </div>
            <div class="assignment-header-actions">
              <AssignmentQuickActions
                :assignment="dados.atividade"
                @view="abaAtiva = 'geral'"
                @updated="atualizarAtividade"
                @deleted="voltarParaSala"
              />
            </div>
          </header>

          <section class="assignment-metrics" aria-label="Indicadores da atividade">
            <article class="assignment-metric">
              <div class="assignment-metric-label"><Users :size="19" aria-hidden="true" /><span>MATRICULADOS</span></div>
              <strong>{{ dados.estatisticas.total_enrolled }}</strong>
            </article>
            <article class="assignment-metric">
              <div class="assignment-metric-label"><ListCheck :size="19" aria-hidden="true" /><span>ENTREGARAM</span></div>
              <strong>{{ totalEntregaram }}</strong>
            </article>
            <article class="assignment-metric">
              <div class="assignment-metric-label"><FileEdit :size="19" aria-hidden="true" /><span>AGUARDANDO REVISÃO</span></div>
              <strong>{{ dados.estatisticas.awaiting_review }}</strong>
            </article>
            <article class="assignment-metric">
              <div class="assignment-metric-label"><ChartBar :size="19" aria-hidden="true" /><span>MÉDIA</span></div>
              <strong>{{ formatarNota(dados.estatisticas.average_grade) }}</strong>
            </article>
          </section>

          <nav
            class="assignment-tabs"
            aria-label="Seções da atividade"
          >
            <button
              type="button"
              :class="{
                'assignment-tab--active':
                  abaAtiva === 'geral'
              }"
              @click="abaAtiva = 'geral'"
            >
              Visão geral
            </button>

            <button
              type="button"
              :class="{
                'assignment-tab--active':
                  abaAtiva === 'entregas'
              }"
              @click="abaAtiva = 'entregas'"
            >
              Entregas
              <span>
                {{ totalEntregaram }}
              </span>
            </button>
          </nav>

          <!-- VISÃO GERAL -->

          <section
            v-if="abaAtiva === 'geral'"
            class="assignment-section"
          >
            <div class="assignment-section-heading">
              <span>// CONTEÚDO</span>

              <h2>
                {{
                  dados.atividade.type ===
                  'questionnaire'
                    ? 'Questões'
                    : 'Configuração da atividade'
                }}
              </h2>
            </div>

            <!-- QUESTIONÁRIO -->

            <div
              v-if="
                dados.atividade.type ===
                'questionnaire'
              "
              class="assignment-question-list"
            >
              <article
                v-for="
                  (questao, index) in
                    dados.atividade.config.questions
                "
                :key="questao.id"
                class="assignment-question"
              >
                <div class="assignment-question-heading">
                  <span>
                    QUESTÃO {{ index + 1 }}
                  </span>

                  <span>
                    {{
                      questao.type === 'choice'
                        ? 'Múltipla escolha'
                        : 'Aberta'
                    }}
                    ·
                    {{ questao.points }}
                    {{
                      questao.points === 1
                        ? 'ponto'
                        : 'pontos'
                    }}
                  </span>
                </div>

                <h3>
                  {{ questao.statement }}
                </h3>

                <div
                  v-if="questao.type === 'choice'"
                  class="assignment-options"
                >
                  <div
                    v-for="
                      alternativa in questao.options
                    "
                    :key="alternativa.id"
                    class="assignment-option"
                    :class="{
                      'assignment-option--correct':
                        alternativaCorreta(
                          questao,
                          alternativa
                        )
                    }"
                  >
                    <strong>
                      {{ alternativa.id }}
                    </strong>

                    <span>
                      {{ alternativa.text }}
                    </span>

                    <small
                      v-if="
                        alternativaCorreta(
                          questao,
                          alternativa
                        )
                      "
                    >
                      Gabarito
                    </small>
                  </div>
                </div>

                <div
                  v-else
                  class="assignment-open-config"
                >
                  <div>
                    <span>
                      RESPOSTA DE REFERÊNCIA
                    </span>

                    <p>
                      {{
                        questao.reference_answer ||
                        'Não informada.'
                      }}
                    </p>
                  </div>

                  <div>
                    <span>RUBRICA</span>

                    <p>
                      {{
                        questao.rubric ||
                        'Não informada.'
                      }}
                    </p>
                  </div>
                </div>
              </article>
            </div>

            <!-- CÓDIGO -->

            <div
              v-else
              class="assignment-code-content"
            >
              <div class="assignment-code-summary">
                <article>
                  <span>TEMPO MÁXIMO</span>

                  <strong>
                    {{
                      dados.atividade.config
                        .time_limit_sec
                    }}
                    s
                  </strong>
                </article>

                <article>
                  <span>MEMÓRIA</span>

                  <strong>
                    {{
                      dados.atividade.config
                        .memory_limit_mb
                    }}
                    MB
                  </strong>
                </article>

                <article>
                  <span>CASOS DE TESTE</span>

                  <strong>
                    {{
                      dados.atividade.config
                        .test_cases.length
                    }}
                  </strong>
                </article>
              </div>

              <section
                class="assignment-content-block"
              >
                <span>// LINGUAGENS</span>

                <div
                  class="assignment-language-list"
                >
                  <article
                    v-for="
                      linguagem in
                        dados.atividade.config.languages
                    "
                    :key="linguagem.name"
                  >
                    <h3>
                      {{ linguagem.name }}
                    </h3>

                    <pre><code>{{ linguagem.starter_code || '// Sem código inicial' }}</code></pre>
                  </article>
                </div>
              </section>

              <section
                class="assignment-content-block"
              >
                <span>// RUBRICA</span>

                <p>
                  {{
                    dados.atividade.config.rubric ||
                    'Nenhuma rubrica cadastrada.'
                  }}
                </p>
              </section>

              <section
                class="assignment-content-block"
              >
                <span>// CASOS DE TESTE</span>

                <div
                  v-if="
                    dados.atividade.config
                      .test_cases.length
                  "
                  class="assignment-test-list"
                >
                  <article
                    v-for="
                      caso in
                        dados.atividade.config.test_cases
                    "
                    :key="caso.id"
                  >
                    <h3>
                      Caso {{ caso.id }}
                    </h3>

                    <div>
                      <span>ENTRADA</span>

                      <pre><code>{{ caso.input }}</code></pre>
                    </div>

                    <div>
                      <span>SAÍDA ESPERADA</span>

                      <pre><code>{{ caso.expected_output }}</code></pre>
                    </div>
                  </article>
                </div>

                <p v-else>
                  Nenhum caso de teste cadastrado.
                </p>
              </section>
            </div>
          </section>

          <!-- ENTREGAS -->

          <section
            v-else
            class="assignment-section"
          >
            <div class="assignment-section-heading">
              <span>// ENTREGAS</span>

              <h2>
                Entregas registradas
              </h2>

              <p>
                {{ totalEntregaram }}
                de
                {{
                  dados.estatisticas.total_enrolled
                }}
                alunos entregaram.
              </p>
            </div>

            <div v-if="entregas.length" class="assignment-delivery-toolbar">
              <label class="assignment-delivery-field assignment-delivery-search">
                <span><Search :size="15" /> Pesquisar aluno</span>
                <input v-model="pesquisaEntrega" type="search" placeholder="Nome ou e-mail" autocomplete="off" />
              </label>
              <label class="assignment-delivery-field">
                <span><Filter :size="15" /> Situação</span>
                <select v-model="filtroEntrega">
                  <option value="todas">Todas as situações</option>
                  <option v-for="status in statusDisponiveis" :key="status" :value="status">{{ formatarStatus(status) }}</option>
                </select>
              </label>
              <label class="assignment-delivery-field">
                <span><SortAmountDown :size="15" /> Ordenar</span>
                <select v-model="ordemEntrega">
                  <option value="recentes">Entregas recentes</option>
                  <option value="antigas">Entregas antigas</option>
                  <option value="nome">Aluno (A–Z)</option>
                  <option value="nota">Maior nota</option>
                </select>
              </label>
            </div>

            <div v-if="entregas.length" class="assignment-delivery-count" aria-live="polite">
              <span><Users :size="16" /> {{ entregasVisiveis.length }} de {{ entregas.length }} entregas exibidas</span>
              <button v-if="pesquisaEntrega || filtroEntrega !== 'todas' || ordemEntrega !== 'recentes'" type="button" @click="limparFiltrosEntrega">Limpar filtros</button>
            </div>

            <div
              v-if="entregasVisiveis.length"
              class="assignment-submission-list"
            >
              <button
                v-for="submissao in entregasVisiveis"
                :key="submissao.id"
                type="button"
                class="assignment-submission assignment-submission--button"
                @click="abrirEntrega(submissao.id)"
              >
                <div class="assignment-student">
                  <strong>
                    {{
                      submissao.student?.full_name || 'Aluno sem nome' 
                    }}
                  </strong>

                  <span>
                    {{ submissao.student?.email || 'E-mail não informado' }}
                  </span>
                </div>

                <div>
                  <span>STATUS</span>

                  <span class="assignment-delivery-status" :class="`assignment-delivery-status--${classeStatusEntrega(submissao.status)}`">
                    <CheckCircle v-if="submissao.status === 'published'" :size="14" />
                    <Clock v-else :size="14" />
                    {{ formatarStatus(submissao.status) }}
                  </span>
                </div>

                <div>
                  <span>NOTA</span>

                  <strong>
                    {{
                      formatarNota(
                        submissao.grade
                      )
                    }}
                  </strong>
                </div>

                <div>
                  <span>ENTREGUE EM</span>

                  <strong>
                    {{
                      formatarData(
                        submissao.submitted_at
                      )
                    }}
                  </strong>
                </div>
              </button>
            </div>

            <div v-else-if="entregas.length" class="assignment-empty">
              <span>// SEM RESULTADOS</span>
              <h3>Nenhuma entrega corresponde à pesquisa ou aos filtros.</h3>
              <button type="button" class="assignment-delivery-clear" @click="limparFiltrosEntrega">Limpar filtros</button>
            </div>

            <div
              v-else
              class="assignment-empty"
            >
              <span>// SEM ENTREGAS</span>

              <h3>
                Nenhum aluno entregou esta atividade ainda.
              </h3>
            </div>
          </section>
        </template>
      </main>
    </component>
  </component>
</template>

<style src="./estilos.css"></style>
