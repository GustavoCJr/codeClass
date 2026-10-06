<script setup>
import {
  computed,
  onMounted,
  ref
} from 'vue'

import SidebarLayout from 'primevue/sidebarlayout'
import SidebarMain from 'primevue/sidebarmain'

import SidebarProfessor from '../../components/sidebarProfessor.vue'

import { buscarPaginaAtividade } from './service'

const dados = ref(null)
const carregando = ref(true)
const erro = ref('')
const abaAtiva = ref('geral')

function obterIdAtividade() {
  return new URLSearchParams(
    window.location.search
  ).get('id')
}

const assignmentId = obterIdAtividade()

const entregas = computed(() => {
  return (dados.value?.submissoes || [])
    .filter((submissao) => {
      return submissao.status !== 'draft'
    })
    .sort((a, b) => {
      return new Date(b.submitted_at) -
        new Date(a.submitted_at)
    })
})

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
  window.location.href =
    `/corrigirEntrega.html?id=${encodeURIComponent(submissionId)}`
}

function voltarParaSala() {
  const classroomId =
    dados.value?.atividade?.classroom_id

  if (!classroomId) {
    window.location.href = '/salas.html'
    return
  }

  window.location.href =
    `/sala.html?id=${encodeURIComponent(classroomId)}&tab=atividades`
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
  <SidebarLayout>
    <SidebarProfessor />

    <SidebarMain>
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

          <a href="/salas.html">
            Voltar para salas
          </a>
        </div>

        <template v-else-if="dados">
          <button
            type="button"
            class="assignment-back"
            @click="voltarParaSala"
          >
            ← Voltar para a sala
          </button>

          <header class="assignment-header">
            <div class="assignment-header-copy">
              <span class="assignment-kicker">
                // {{ formatarTipo(dados.atividade.type) }}
              </span>

              <h1>
                {{ dados.atividade.title }}
              </h1>

              <p>
                {{
                  dados.atividade.description ||
                  'Sem descrição cadastrada.'
                }}
              </p>

              <div class="assignment-header-meta">
                <span>
                  PRAZO
                  <strong>
                    {{
                      formatarData(
                        dados.atividade.deadline
                      )
                    }}
                  </strong>
                </span>

                <span>
                  RESULTADO
                  <strong>
                    {{
                      formatarLiberacao(
                        dados.atividade.release_policy
                      )
                    }}
                  </strong>
                </span>
              </div>
            </div>

            <button
              type="button"
              class="assignment-secondary-button"
              disabled
              title="A edição será implementada em uma próxima etapa."
            >
              Editar atividade
            </button>
          </header>

          <section class="assignment-metrics">
            <article class="assignment-metric">
              <span>MATRICULADOS</span>

              <strong>
                {{
                  dados.estatisticas.total_enrolled
                }}
              </strong>
            </article>

            <article class="assignment-metric">
              <span>ENTREGARAM</span>

              <strong>
                {{ totalEntregaram }}
              </strong>
            </article>

            <article class="assignment-metric">
              <span>AGUARDANDO REVISÃO</span>

              <strong>
                {{
                  dados.estatisticas.awaiting_review
                }}
              </strong>
            </article>

            <article class="assignment-metric">
              <span>MÉDIA</span>

              <strong>
                {{
                  formatarNota(
                    dados.estatisticas.average_grade
                  )
                }}
              </strong>
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

            <div
              v-if="entregas.length"
              class="assignment-submission-list"
            >
              <button
                v-for="submissao in entregas"
                :key="submissao.id"
                type="button"
                class="assignment-submission assignment-submission--button"
                @click="abrirEntrega(submissao.id)"
              >
                <div class="assignment-student">
                  <strong>
                    {{
                      submissao.student.full_name
                    }}
                  </strong>

                  <span>
                    {{ submissao.student.email }}
                  </span>
                </div>

                <div>
                  <span>STATUS</span>

                  <strong>
                    {{
                      formatarStatus(
                        submissao.status
                      )
                    }}
                  </strong>
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
    </SidebarMain>
  </SidebarLayout>
</template>

<style src="./estilos.css"></style>
