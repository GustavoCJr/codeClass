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
  onUnmounted,
  reactive,
  ref
} from 'vue'

import SidebarLayout from 'primevue/sidebarlayout'
import SidebarMain from 'primevue/sidebarmain'

import SidebarProfessor from '../../components/sidebarProfessor.vue'
import { api } from '../../config/api'

import {
  buscarPaginaCorrecao,
  salvarAvaliacao
} from './service'

const dados = ref(null)
const carregando = ref(true)
const erro = ref('')
const salvando = ref(false)
const mensagem = ref('')
const erroSalvar = ref('')
const atualizandoIA = ref(false)
async function atualizarIA(retry = false) {
  if (atualizandoIA.value || salvando.value) return
  atualizandoIA.value = true
  erroSalvar.value = ''
  try {
    const resultado = await api(`/submissions/${encodeURIComponent(submissionId)}${retry ? '/retry-ai' : ''}`, retry ? { method: 'POST' } : {})
    dados.value.submissao.ai_insight = resultado.ai_insight
    dados.value.submissao.status = resultado.status
    mensagem.value = retry ? 'Nova análise solicitada. Use Atualizar análise para acompanhar.' : 'Análise atualizada.'
  } catch (error) { erroSalvar.value = error.message }
  finally { atualizandoIA.value = false }
}

const feedbackGeral = ref('')
const notaCodigo = ref(null)

const correcoesQuestoes = reactive({})
const formularioSalvo = ref('')
const proximaEntrega = ref(null)
function snapshotFormulario() { return JSON.stringify({ feedbackGeral: feedbackGeral.value, notaCodigo: notaCodigo.value, correcoesQuestoes }) }
function protegerSaida(event) {
  if (!dados.value || snapshotFormulario() === formularioSalvo.value) return
  event.preventDefault(); event.returnValue = ''
}
async function carregarProximaEntrega() {
  try {
    const entregas = await api(`/submissions?status=awaiting_review&classroom_id=${encodeURIComponent(atividade.value.classroom_id)}`)
    proximaEntrega.value = entregas.filter(item => item.id !== submissionId).sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at))[0] || null
  } catch { proximaEntrega.value = null }
}

function obterSubmissionId() {
  return new URLSearchParams(
    (route?.query ? new URLSearchParams(route.query).toString() : window.location.search)
  ).get('id')
}

const submissionId = obterSubmissionId()

const submissao = computed(() => {
  return dados.value?.submissao || null
})

const atividade = computed(() => {
  return dados.value?.atividade || null
})

const questionario = computed(() => {
  return atividade.value?.type === 'questionnaire'
})

const codigo = computed(() => {
  return atividade.value?.type === 'code'
})

const processamentoPendente = computed(() => {
  return submissao.value?.status === 'pending'
})

const publicado = computed(() => {
  return submissao.value?.status === 'published'
})

const podeCorrigir = computed(() => {
  return !processamentoPendente.value
})

const questoes = computed(() => {
  return atividade.value?.config?.questions || []
})

const respostasPorQuestao = computed(() => {
  const respostas =
    submissao.value?.content?.answers || []

  return Object.fromEntries(
    respostas.map((resposta) => [
      Number(resposta.question_id),
      resposta
    ])
  )
})

const insightsPorQuestao = computed(() => {
  const itens =
    submissao.value?.ai_insight?.item_insights || []

  return Object.fromEntries(
    itens.map((item) => [
      Number(item.question_id),
      item
    ])
  )
})

const avaliacaoPorQuestao = computed(() => {
  const itens =
    submissao.value?.evaluation
      ?.detailed_scores
      ?.questions_evaluation || []

  return Object.fromEntries(
    itens.map((item) => [
      Number(item.question_id),
      item
    ])
  )
})

const notaQuestionario = computed(() => {
  return questoes.value.reduce(
    (total, questao) => {
      const registro =
        correcoesQuestoes[questao.id]

      const valor = Number(
        registro?.pontos ?? 0
      )

      return total +
        (Number.isFinite(valor) ? valor : 0)
    },
    0
  )
})

const notaMaximaQuestionario = computed(() => {
  return questoes.value.reduce(
    (total, questao) => {
      return total + Number(questao.points || 0)
    },
    0
  )
})

function formatarData(valor) {
  if (!valor) {
    return '—'
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  ).format(new Date(valor))
}

function formatarStatus(status) {
  const labels = {
    draft: 'Rascunho',
    pending: 'Processando',
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

  if (!Number.isFinite(numero)) {
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

function formatarTipo(tipo) {
  if (tipo === 'code') {
    return 'CÓDIGO'
  }

  if (tipo === 'questionnaire') {
    return 'QUESTIONÁRIO'
  }

  return String(tipo || '').toUpperCase()
}

function respostaDaQuestao(questao) {
  return respostasPorQuestao.value[
    Number(questao.id)
  ] || null
}

function insightDaQuestao(questao) {
  return insightsPorQuestao.value[
    Number(questao.id)
  ] || null
}

function opcaoPorId(questao, optionId) {
  return (questao.options || []).find(
    (opcao) =>
      String(opcao.id) === String(optionId)
  )
}

function textoRespostaAluno(questao) {
  const resposta = respostaDaQuestao(questao)

  if (!resposta) {
    return 'Não respondida.'
  }

  if (questao.type === 'choice') {
    const opcao = opcaoPorId(
      questao,
      resposta.selected_option_id
    )

    if (!opcao) {
      return resposta.selected_option_id
    }

    return `${opcao.id}) ${opcao.text}`
  }

  return resposta.text_answer ||
    'Não respondida.'
}

function textoGabarito(questao) {
  if (questao.type === 'choice') {
    const opcao = opcaoPorId(
      questao,
      questao.correct_option_id
    )

    if (!opcao) {
      return questao.correct_option_id
    }

    return `${opcao.id}) ${opcao.text}`
  }

  return questao.reference_answer ||
    'Não informado.'
}

function questaoObjetivaCorreta(questao) {
  if (questao.type !== 'choice') {
    return null
  }

  const resposta = respostaDaQuestao(questao)

  if (!resposta) {
    return false
  }

  return String(
    resposta.selected_option_id
  ) === String(
    questao.correct_option_id
  )
}

function inicializarFormulario() {
  feedbackGeral.value =
    submissao.value?.evaluation
      ?.general_feedback || ''

  if (codigo.value) {
    const existente =
      submissao.value?.evaluation?.grade

    const sugerida =
      submissao.value?.ai_insight
        ?.suggested_grade

    notaCodigo.value =
      existente !== null &&
      existente !== undefined
        ? Number(existente)
        : sugerida !== null &&
          sugerida !== undefined
          ? Number(sugerida)
          : null
  }

  if (questionario.value) {
    for (const questao of questoes.value) {
      const existente =
        avaliacaoPorQuestao.value[
          Number(questao.id)
        ]

      let pontos = 0

      if (
        existente?.awarded_points !==
        undefined
      ) {
        pontos =
          Number(existente.awarded_points)
      } else if (questao.type === 'choice') {
        pontos =
          questaoObjetivaCorreta(questao)
            ? Number(questao.points || 0)
            : 0
      } else {
        const insight =
          insightDaQuestao(questao)

        pontos =
          insight?.suggested_grade !==
          undefined
            ? Number(
                insight.suggested_grade
              )
            : 0
      }

      correcoesQuestoes[questao.id] = {
        pontos,
        feedback:
          existente?.teacher_feedback || ''
      }
    }
  }
}

function voltarParaAtividade() {
  const assignmentId =
    submissao.value?.assignment?.id

  if (!assignmentId) {
    navegar('/salas.html')
    return
  }

  navegar(`/atividade.html?id=${encodeURIComponent(assignmentId)}`)
}

function validarFormulario() {
  erroSalvar.value = ''
  mensagem.value = ''

  if (!podeCorrigir.value) {
    erroSalvar.value =
      'A submissão ainda está sendo processada.'
    return false
  }

  if (codigo.value) {
    const nota = Number(notaCodigo.value)

    if (
      notaCodigo.value === null ||
      notaCodigo.value === '' ||
      !Number.isFinite(nota) ||
      nota < 0 ||
      nota > 10
    ) {
      erroSalvar.value =
        'Informe uma nota de 0 a 10.'
      return false
    }
  }

  if (questionario.value) {
    for (const questao of questoes.value) {
      const registro =
        correcoesQuestoes[questao.id]

      const pontos =
        Number(registro?.pontos)

      const maximo =
        Number(questao.points || 0)

      if (
        !Number.isFinite(pontos) ||
        pontos < 0 ||
        pontos > maximo
      ) {
        erroSalvar.value =
          `A pontuação da questão ${questao.id} deve ficar entre 0 e ${maximo}.`
        return false
      }
    }

    if (
      notaQuestionario.value < 0 ||
      notaQuestionario.value > 100
    ) {
      erroSalvar.value =
        'A nota final precisa ficar entre 0 e 100, conforme a validação do backend.'
      return false
    }
  }

  return true
}

function montarDetailedScores() {
  if (!questionario.value) {
    return null
  }

  return {
    questions_evaluation:
      questoes.value.map((questao) => {
        const registro =
          correcoesQuestoes[questao.id]

        const item = {
          question_id: Number(questao.id),
          type: questao.type,
          awarded_points:
            Number(registro.pontos),
          max_points:
            Number(questao.points || 0),
          teacher_feedback:
            registro.feedback?.trim() ||
            null
        }

        if (questao.type === 'choice') {
          item.is_correct =
            questaoObjetivaCorreta(
              questao
            )
        }

        return item
      })
  }
}

function montarPayload(publicar) {
  const grade = questionario.value
    ? notaQuestionario.value
    : Number(notaCodigo.value)

  return {
    grade,
    general_feedback:
      feedbackGeral.value.trim() || null,
    detailed_scores:
      montarDetailedScores(),
    publish: publicar
  }
}

async function avaliar(publicar) {
  if (salvando.value || atualizandoIA.value) return
  if (!validarFormulario()) {
    return
  }

  salvando.value = true
  erroSalvar.value = ''
  mensagem.value = ''

  try {
    const payload =
      montarPayload(publicar)

    const avaliacao =
      await salvarAvaliacao(
        submissionId,
        payload
      )

    dados.value.submissao.evaluation =
      avaliacao
    formularioSalvo.value = snapshotFormulario()

    if (publicar) {
      dados.value.submissao.status =
        'published'
      dados.value.submissao.grade =
        payload.grade

      mensagem.value =
        publicado.value
          ? 'Resultado publicado com sucesso.'
          : 'Resultado publicado com sucesso.'
    } else {
      dados.value.submissao.status =
        'awaiting_review'
      dados.value.submissao.grade = null

      mensagem.value =
        'Correção salva. O resultado ainda não foi publicado para o aluno.'
    }
  } catch (error) {
    console.error(error)

    erroSalvar.value =
      error instanceof Error
        ? error.message
        : 'Não foi possível salvar a correção.'
  } finally {
    salvando.value = false
  }
}

async function carregarPagina() {
  if (!submissionId) {
    erro.value =
      'Não foi informada qual entrega deve ser corrigida.'

    carregando.value = false
    return
  }

  carregando.value = true
  erro.value = ''

  try {
    dados.value =
      await buscarPaginaCorrecao(
        submissionId
      )

    inicializarFormulario()
    formularioSalvo.value = snapshotFormulario()
    carregarProximaEntrega()
  } catch (error) {
    console.error(error)

    erro.value =
      error instanceof Error
        ? error.message
        : 'Não foi possível carregar a entrega.'
  } finally {
    carregando.value = false
  }
}

if (props.embedded) onBeforeRouteLeave(() => {
  if (!dados.value || snapshotFormulario() === formularioSalvo.value) return true
  return window.confirm('Há alterações não salvas. Deseja sair sem salvar?')
})
onMounted(() => { carregarPagina(); window.addEventListener('beforeunload', protegerSaida) })
onUnmounted(() => window.removeEventListener('beforeunload', protegerSaida))
</script>

<template>
  <component :is="embedded ? 'div' : SidebarLayout">
    <SidebarProfessor v-if="!embedded" />

    <component :is="embedded ? 'div' : SidebarMain">
      <main class="review-page">
        <div
          v-if="carregando"
          class="review-state"
        >
          Carregando entrega...
        </div>

        <div
          v-else-if="erro"
          class="review-state review-state--error"
        >
          <span>
            // NÃO FOI POSSÍVEL ABRIR A ENTREGA
          </span>

          <h1>{{ erro }}</h1>

          <a href="/salas.html">
            Voltar para salas
          </a>
        </div>

        <template v-else-if="dados">
          <button
            type="button"
            class="review-back"
            @click="voltarParaAtividade"
          >
            ← Voltar para atividade
          </button>

          <header class="review-header">
            <div>
              <span class="review-kicker">
                //
                {{
                  formatarTipo(
                    atividade.type
                  )
                }}
              </span>

              <h1>
                {{ atividade.title }}
              </h1>

              <p>
                Correção da entrega de
                <strong>
                  {{
                    submissao.student
                      .full_name
                  }}
                </strong>
              </p>
            </div>

            <div class="review-header-status">
              <span>STATUS</span>

              <strong>
                {{
                  formatarStatus(
                    submissao.status
                  )
                }}
              </strong>
            </div>
          </header>
          <div class="cc-management-actions">
            <a href="/correcoes.html">Voltar para central de correções</a>
            <a v-if="proximaEntrega" :href="`/corrigirEntrega.html?id=${encodeURIComponent(proximaEntrega.id)}`">Próxima entrega: {{ proximaEntrega.student.full_name }}</a>
            <button type="button" :disabled="atualizandoIA || salvando" @click="atualizarIA(false)">Atualizar análise</button>
            <button v-if="submissao.ai_insight?.status === 'failed'" type="button" :disabled="atualizandoIA || salvando" @click="atualizarIA(true)">Tentar análise novamente</button>
          </div>

          <section class="review-student-card">
            <div>
              <span>ALUNO</span>

              <strong>
                {{
                  submissao.student
                    .full_name
                }}
              </strong>

              <small>
                {{
                  submissao.student.email
                }}
              </small>
            </div>

            <div>
              <span>ENVIADO EM</span>

              <strong>
                {{
                  formatarData(
                    submissao.submitted_at
                  )
                }}
              </strong>
            </div>

            <div>
              <span>NOTA PUBLICADA</span>

              <strong>
                {{
                  formatarNota(
                    submissao.grade
                  )
                }}
              </strong>
            </div>
          </section>

          <section
            v-if="processamentoPendente"
            class="review-notice"
          >
            <span>// PROCESSANDO</span>

            <h2>
              A análise desta entrega ainda está em andamento.
            </h2>

            <p>
              O conteúdo pode ser consultado, mas a correção fica bloqueada até o backend finalizar o processamento.
            </p>
          </section>

          <section
            v-if="
              submissao.ai_insight?.status ===
              'failed'
            "
            class="review-notice review-notice--warning"
          >
            <span>// IA INDISPONÍVEL</span>

            <h2>
              A análise automática não foi concluída.
            </h2>

            <p>
              {{
                submissao.ai_insight
                  .error_message ||
                'A correção manual continua disponível.'
              }}
            </p>
          </section>

          <!-- QUESTIONÁRIO -->

          <template v-if="questionario">
            <section class="review-section">
              <div class="review-section-heading">
                <span>// RESPOSTAS</span>

                <h2>
                  Correção por questão
                </h2>

                <p>
                  A nota final é calculada pela soma das pontuações atribuídas abaixo.
                </p>
              </div>

              <div class="review-question-list">
                <article
                  v-for="
                    (questao, index) in
                      questoes
                  "
                  :key="questao.id"
                  class="review-question"
                >
                  <div class="review-question-heading">
                    <span>
                      QUESTÃO
                      {{ index + 1 }}
                    </span>

                    <span>
                      {{
                        questao.type ===
                        'choice'
                          ? 'Múltipla escolha'
                          : 'Aberta'
                      }}
                      ·
                      {{ questao.points }}
                      pts
                    </span>
                  </div>

                  <h3>
                    {{ questao.statement }}
                  </h3>

                  <div class="review-answer-grid">
                    <div>
                      <span>
                        RESPOSTA DO ALUNO
                      </span>

                      <p>
                        {{
                          textoRespostaAluno(
                            questao
                          )
                        }}
                      </p>
                    </div>

                    <div>
                      <span>
                        {{
                          questao.type ===
                          'choice'
                            ? 'GABARITO'
                            : 'RESPOSTA DE REFERÊNCIA'
                        }}
                      </span>

                      <p>
                        {{
                          textoGabarito(
                            questao
                          )
                        }}
                      </p>
                    </div>
                  </div>

                  <div
                    v-if="
                      questao.type ===
                        'open' &&
                      insightDaQuestao(
                        questao
                      )
                    "
                    class="review-ai-item"
                  >
                    <span>
                      // SUGESTÃO DA IA
                    </span>

                    <div class="review-ai-score">
                      <strong>
                        {{
                          formatarNota(
                            insightDaQuestao(
                              questao
                            ).suggested_grade
                          )
                        }}
                      </strong>

                      <small>
                        /
                        {{
                          formatarNota(
                            insightDaQuestao(
                              questao
                            ).max_grade
                          )
                        }}
                      </small>
                    </div>

                    <p>
                      {{
                        insightDaQuestao(
                          questao
                        ).reasoning
                      }}
                    </p>
                  </div>

                  <div class="review-correction-fields">
                    <label>
                      <span>PONTOS</span>

                      <div class="review-score-input">
                        <input
                          v-model.number="
                            correcoesQuestoes[
                              questao.id
                            ].pontos
                          "
                          type="number"
                          min="0"
                          :max="questao.points"
                          step="0.1"
                          :disabled="
                            !podeCorrigir
                          "
                        />

                        <strong>
                          / {{ questao.points }}
                        </strong>
                      </div>
                    </label>

                    <label>
                      <span>
                        FEEDBACK DA QUESTÃO
                      </span>

                      <textarea
                        v-model="
                          correcoesQuestoes[
                            questao.id
                          ].feedback
                        "
                        rows="4"
                        :disabled="
                          !podeCorrigir
                        "
                        placeholder="Comentário opcional para esta questão"
                      ></textarea>
                    </label>
                  </div>
                </article>
              </div>
            </section>

            <section class="review-total">
              <span>NOTA FINAL</span>

              <strong>
                {{
                  formatarNota(
                    notaQuestionario
                  )
                }}
                /
                {{
                  formatarNota(
                    notaMaximaQuestionario
                  )
                }}
              </strong>
            </section>
          </template>

          <!-- CÓDIGO -->

          <template v-else-if="codigo">
            <section class="review-section">
              <div class="review-section-heading">
                <span>// CÓDIGO ENVIADO</span>

                <h2>
                  {{
                    submissao.content
                      .language
                  }}
                </h2>
              </div>

              <pre class="review-code"><code>{{ submissao.content.code }}</code></pre>
            </section>

            <section class="review-section">
              <div class="review-section-heading">
                <span>// RUBRICA</span>

                <h2>
                  Critérios da atividade
                </h2>
              </div>

              <p class="review-preline">
                {{
                  atividade.config.rubric ||
                  'Nenhuma rubrica cadastrada.'
                }}
              </p>
            </section>

            <section
              v-if="
                submissao.ai_insight &&
                submissao.ai_insight
                  .status === 'completed'
              "
              class="review-section review-ai"
            >
              <div class="review-section-heading">
                <span>// ANÁLISE DA IA</span>

                <h2>
                  Sugestão para o professor
                </h2>
              </div>

              <div class="review-ai-summary">
                <article>
                  <span>NOTA SUGERIDA</span>

                  <strong>
                    {{
                      formatarNota(
                        submissao.ai_insight
                          .suggested_grade
                      )
                    }}
                    /
                    {{
                      formatarNota(
                        submissao.ai_insight
                          .max_grade
                      )
                    }}
                  </strong>
                </article>
              </div>

              <div class="review-ai-columns">
                <div>
                  <span>PONTOS FORTES</span>

                  <ul
                    v-if="
                      submissao.ai_insight
                        .strengths?.length
                    "
                  >
                    <li
                      v-for="
                        item in
                          submissao.ai_insight
                            .strengths
                      "
                      :key="item"
                    >
                      {{ item }}
                    </li>
                  </ul>

                  <p v-else>
                    Nenhum ponto forte informado.
                  </p>
                </div>

                <div>
                  <span>PONTOS A MELHORAR</span>

                  <ul
                    v-if="
                      submissao.ai_insight
                        .improvements?.length
                    "
                  >
                    <li
                      v-for="
                        item in
                          submissao.ai_insight
                            .improvements
                      "
                      :key="item"
                    >
                      {{ item }}
                    </li>
                  </ul>

                  <p v-else>
                    Nenhum ponto de melhoria informado.
                  </p>
                </div>
              </div>

              <div class="review-ai-reasoning">
                <span>JUSTIFICATIVA</span>

                <p>
                  {{
                    submissao.ai_insight
                      .reasoning ||
                    'Sem justificativa.'
                  }}
                </p>
              </div>
            </section>

            <section class="review-section">
              <div class="review-section-heading">
                <span>// CORREÇÃO DO PROFESSOR</span>

                <h2>
                  Nota final
                </h2>
              </div>

              <label class="review-grade-field">
                <span>NOTA DE 0 A 10</span>

                <input
                  v-model.number="notaCodigo"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  :disabled="
                    !podeCorrigir
                  "
                />
              </label>
            </section>
          </template>

          <section class="review-section">
            <div class="review-section-heading">
              <span>// FEEDBACK GERAL</span>

              <h2>
                Parecer do professor
              </h2>
            </div>

            <textarea
              v-model="feedbackGeral"
              class="review-general-feedback"
              rows="7"
              :disabled="!podeCorrigir"
              placeholder="Escreva um feedback geral para o aluno"
            ></textarea>
          </section>

          <div
            v-if="erroSalvar"
            class="review-message review-message--error"
          >
            {{ erroSalvar }}
          </div>

          <div
            v-if="mensagem"
            class="review-message review-message--success"
          >
            {{ mensagem }}
          </div>

          <footer class="review-actions">
            <template v-if="publicado">
              <button
                type="button"
                class="review-primary-button"
                :disabled="
                  salvando ||
                  !podeCorrigir
                "
                @click="avaliar(true)"
              >
                {{
                  salvando
                    ? 'Salvando...'
                    : 'Atualizar resultado publicado'
                }}
              </button>
            </template>

            <template v-else>
              <button
                type="button"
                class="review-secondary-button"
                :disabled="
                  salvando ||
                  !podeCorrigir
                "
                @click="avaliar(false)"
              >
                Salvar correção
              </button>

              <button
                type="button"
                class="review-primary-button"
                :disabled="
                  salvando ||
                  !podeCorrigir
                "
                @click="avaliar(true)"
              >
                {{
                  salvando
                    ? 'Publicando...'
                    : 'Publicar resultado'
                }}
              </button>
            </template>
          </footer>
        </template>
      </main>
    </component>
  </component>
</template>

<style src="./estilos.css"></style>
