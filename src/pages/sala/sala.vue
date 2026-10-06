<script setup>
import {
  computed,
  onMounted,
  ref
} from 'vue'

import SidebarLayout from 'primevue/sidebarlayout'
import SidebarMain from 'primevue/sidebarmain'

import SidebarProfessor from '../../components/sidebarProfessor.vue'
import ActivityDialog from '../../components/classroom/ActivityDialog.vue'

import { buscarPaginaSala } from './service'

const dados = ref(null)
const carregando = ref(true)
const erro = ref('')

function obterAbaInicial() {
  const tab = new URLSearchParams(
    window.location.search
  ).get('tab')

  if (
    tab === 'geral' ||
    tab === 'atividades' ||
    tab === 'alunos'
  ) {
    return tab
  }

  return 'geral'
}

const abaAtiva = ref(obterAbaInicial())
const buscaAluno = ref('')

const activityDialogVisible = ref(false)

function obterIdSala() {
  return new URLSearchParams(
    window.location.search
  ).get('id')
}

const classroomId = obterIdSala()

const atividadesOrdenadas = computed(() => {
  const atividades = dados.value?.atividades || []

  return [...atividades].sort(
    (a, b) => {
      if (!a.deadline && !b.deadline) {
        return new Date(b.created_at) -
          new Date(a.created_at)
      }

      if (!a.deadline) {
        return 1
      }

      if (!b.deadline) {
        return -1
      }

      return new Date(a.deadline) -
        new Date(b.deadline)
    }
  )
})

const proximasAtividades = computed(() => {
  const agora = new Date()

  return atividadesOrdenadas.value
    .filter((atividade) => {
      if (!atividade.deadline) {
        return false
      }

      return new Date(atividade.deadline) >= agora
    })
    .slice(0, 4)
})

const proximoPrazo = computed(() => {
  return proximasAtividades.value[0] || null
})

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

const alunosFiltrados = computed(() => {
  const alunos =
    dados.value?.membros?.students || []

  const termo =
    normalizarTexto(buscaAluno.value)

  if (!termo) {
    return alunos
  }

  return alunos.filter((aluno) => {
    return normalizarTexto(
      `${aluno.full_name} ${aluno.email}`
    ).includes(termo)
  })
})

function formatarData(
  valor,
  comHorario = false
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

function statusAtividade(atividade) {
  if (!atividade.deadline) {
    return {
      label: 'SEM PRAZO',
      encerrada: false
    }
  }

  const encerrada =
    new Date(atividade.deadline) < new Date()

  return encerrada
    ? {
        label: 'PRAZO ENCERRADO',
        encerrada: true
      }
    : {
        label: 'EM ANDAMENTO',
        encerrada: false
      }
}

function abrirAtividade(assignmentId) {
  window.location.href =
    `/atividade.html?id=${encodeURIComponent(assignmentId)}`
}

function abrirNovaTarefa() {
  activityDialogVisible.value = true
}

function continuarNovaTarefa(dadosIniciais) {
  sessionStorage.setItem(
    'codeclass:nova-tarefa',
    JSON.stringify({
      ...dadosIniciais,
      classroomId
    })
  )

  activityDialogVisible.value = false

  window.location.href =
    '/criarTarefa.html'
}

async function carregarSala() {
  if (!classroomId) {
    erro.value =
      'Não foi informado qual sala deve ser aberta.'

    carregando.value = false
    return
  }

  carregando.value = true
  erro.value = ''

  try {
    dados.value =
      await buscarPaginaSala(classroomId)
  } catch (error) {
    console.error(error)

    erro.value =
      error instanceof Error
        ? error.message
        : 'Não foi possível carregar a sala.'
  } finally {
    carregando.value = false
  }
}

onMounted(carregarSala)
</script>

<template>
  <SidebarLayout>
    <SidebarProfessor />

    <SidebarMain>
      <main class="classroom-page">
        <div
          v-if="carregando"
          class="classroom-state"
        >
          Carregando sala...
        </div>

        <div
          v-else-if="erro"
          class="classroom-state classroom-state--error"
        >
          <span>// NÃO FOI POSSÍVEL ABRIR A SALA</span>
          <h1>{{ erro }}</h1>

          <a href="/salas.html">
            Voltar para salas
          </a>
        </div>

        <template v-else-if="dados">
          <a
            href="/salas.html"
            class="classroom-back"
          >
            ← Voltar para salas
          </a>

          <header class="classroom-header">
            <div class="classroom-header-copy">
              <span class="classroom-kicker">
                // SALA
              </span>

              <h1>{{ dados.sala.name }}</h1>

              <p>
                {{
                  dados.sala.description ||
                  'Sem descrição cadastrada.'
                }}
              </p>

              <div class="classroom-header-meta">
                <span>
                  Professor:
                  <strong>
                    {{ dados.sala.teacher.full_name }}
                  </strong>
                </span>

                <span aria-hidden="true">
                  ·
                </span>

                <span>
                  <strong>
                    {{ dados.sala.total_students }}
                  </strong>
                  {{
                    dados.sala.total_students === 1
                      ? 'aluno'
                      : 'alunos'
                  }}
                </span>
              </div>
            </div>

            <button
              type="button"
              class="classroom-primary-button"
              @click="abrirNovaTarefa"
            >
              + Nova tarefa
            </button>
          </header>

          <nav
            class="classroom-tabs"
            aria-label="Seções da sala"
          >
            <button
              type="button"
              :class="{
                'classroom-tab--active':
                  abaAtiva === 'geral'
              }"
              @click="abaAtiva = 'geral'"
            >
              Geral
            </button>

            <button
              type="button"
              :class="{
                'classroom-tab--active':
                  abaAtiva === 'atividades'
              }"
              @click="abaAtiva = 'atividades'"
            >
              Atividades
              <span>
                {{ dados.atividades.length }}
              </span>
            </button>

            <button
              type="button"
              :class="{
                'classroom-tab--active':
                  abaAtiva === 'alunos'
              }"
              @click="abaAtiva = 'alunos'"
            >
              Alunos
              <span>
                {{ dados.membros.students.length }}
              </span>
            </button>
          </nav>

          <!-- GERAL -->

          <section
            v-if="abaAtiva === 'geral'"
            class="classroom-section"
          >
            <div class="classroom-metrics">
              <article class="classroom-metric">
                <span>ALUNOS</span>

                <strong>
                  {{ dados.sala.total_students }}
                </strong>
              </article>

              <article class="classroom-metric">
                <span>ATIVIDADES</span>

                <strong>
                  {{ dados.atividades.length }}
                </strong>
              </article>

              <article class="classroom-metric">
                <span>PRÓXIMO PRAZO</span>

                <strong
                  class="classroom-metric-date"
                >
                  {{
                    proximoPrazo
                      ? formatarData(
                          proximoPrazo.deadline
                        )
                      : '—'
                  }}
                </strong>
              </article>
            </div>

            <div class="classroom-panel">
              <div class="classroom-panel-heading">
                <div>
                  <span>
                    // PRÓXIMAS ATIVIDADES
                  </span>

                  <h2>Prazos da turma</h2>
                </div>

                <button
                  v-if="dados.atividades.length"
                  type="button"
                  class="classroom-link-button"
                  @click="abaAtiva = 'atividades'"
                >
                  Ver todas
                </button>
              </div>

              <div
                v-if="proximasAtividades.length"
                class="classroom-deadline-list"
              >
                <article
                  v-for="
                    atividade in proximasAtividades
                  "
                  :key="atividade.id"
                  class="classroom-deadline-item"
                >
                  <div class="classroom-deadline-date">
                    <strong>
                      {{
                        formatarData(
                          atividade.deadline
                        )
                      }}
                    </strong>

                    <span>
                      {{
                        formatarTipo(
                          atividade.type
                        )
                      }}
                    </span>
                  </div>

                  <div class="classroom-deadline-copy">
                    <h3>
                      {{ atividade.title }}
                    </h3>

                    <p>
                      {{
                        atividade.description ||
                        'Sem descrição.'
                      }}
                    </p>
                  </div>
                </article>
              </div>

              <div
                v-else
                class="classroom-empty"
              >
                <span>
                  // SEM PRAZOS PRÓXIMOS
                </span>

                <h3>
                  Nenhuma atividade com prazo futuro.
                </h3>
              </div>
            </div>
          </section>

          <!-- ATIVIDADES -->

          <section
            v-else-if="
              abaAtiva === 'atividades'
            "
            class="classroom-section"
          >
            <div class="classroom-section-heading">
              <div>
                <span>
                  // ATIVIDADES DA TURMA
                </span>

                <h2>Atividades</h2>

                <p>
                  Acompanhe as tarefas cadastradas
                  nesta sala.
                </p>
              </div>

              <button
                type="button"
                class="classroom-primary-button"
                @click="abrirNovaTarefa"
              >
                + Nova tarefa
              </button>
            </div>

            <div
              v-if="atividadesOrdenadas.length"
              class="classroom-activity-list"
            >
              <button
                v-for="
                  atividade in atividadesOrdenadas
                "
                :key="atividade.id"
                type="button"
                class="classroom-activity classroom-activity--button"
                @click="abrirAtividade(atividade.id)"
              >
                <div class="classroom-activity-main">
                  <div
                    class="classroom-activity-labels"
                  >
                    <span>
                      {{
                        formatarTipo(
                          atividade.type
                        )
                      }}
                    </span>

                    <span
                      :class="{
                        'classroom-activity-status--closed':
                          statusAtividade(
                            atividade
                          ).encerrada
                      }"
                    >
                      {{
                        statusAtividade(
                          atividade
                        ).label
                      }}
                    </span>
                  </div>

                  <h3>
                    {{ atividade.title }}
                  </h3>

                  <p>
                    {{
                      atividade.description ||
                      'Sem descrição.'
                    }}
                  </p>
                </div>

                <div class="classroom-activity-meta">
                  <span>
                    PRAZO

                    <strong>
                      {{
                        formatarData(
                          atividade.deadline,
                          true
                        )
                      }}
                    </strong>
                  </span>

                  <span>
                    RESULTADO

                    <strong>
                      {{
                        formatarLiberacao(
                          atividade.release_policy
                        )
                      }}
                    </strong>
                  </span>
                </div>
              </button>
            </div>

            <div
              v-else
              class="classroom-empty"
            >
              <span>
                // SEM ATIVIDADES
              </span>

              <h3>
                Esta sala ainda não possui tarefas.
              </h3>

              <button
                type="button"
                class="classroom-primary-button"
                @click="abrirNovaTarefa"
              >
                Criar primeira tarefa
              </button>
            </div>
          </section>

          <!-- ALUNOS -->

          <section
            v-else-if="abaAtiva === 'alunos'"
            class="classroom-section"
          >
            <div class="classroom-section-heading">
              <div>
                <span>
                  // PARTICIPANTES
                </span>

                <h2>Alunos</h2>

                <p>
                  {{
                    dados.membros.students.length
                  }}
                  {{
                    dados.membros.students.length === 1
                      ? 'aluno matriculado'
                      : 'alunos matriculados'
                  }}
                </p>
              </div>
            </div>

            <article class="classroom-teacher">
              <div
                class="classroom-avatar"
                aria-hidden="true"
              >
                {{
                  dados.membros.teacher.full_name
                    .split(' ')
                    .slice(0, 2)
                    .map((nome) => nome[0])
                    .join('')
                    .toUpperCase()
                }}
              </div>

              <div>
                <span>PROFESSOR RESPONSÁVEL</span>

                <strong>
                  {{
                    dados.membros.teacher.full_name
                  }}
                </strong>

                <small>
                  {{ dados.membros.teacher.email }}
                </small>
              </div>
            </article>

            <div class="classroom-student-toolbar">
              <label for="student-search">
                Buscar aluno
              </label>

              <input
                id="student-search"
                v-model="buscaAluno"
                type="search"
                placeholder="Nome ou e-mail"
                autocomplete="off"
              />
            </div>

            <div
              v-if="alunosFiltrados.length"
              class="classroom-student-list"
            >
              <article
                v-for="aluno in alunosFiltrados"
                :key="aluno.student_id"
                class="classroom-student"
              >
                <div
                  class="classroom-avatar"
                  aria-hidden="true"
                >
                  {{
                    aluno.full_name
                      .split(' ')
                      .slice(0, 2)
                      .map((nome) => nome[0])
                      .join('')
                      .toUpperCase()
                  }}
                </div>

                <div class="classroom-student-copy">
                  <strong>
                    {{ aluno.full_name }}
                  </strong>

                  <span>
                    {{ aluno.email }}
                  </span>
                </div>

                <div class="classroom-student-date">
                  MATRICULADO EM

                  <strong>
                    {{
                      formatarData(
                        aluno.enrolled_at
                      )
                    }}
                  </strong>
                </div>
              </article>
            </div>

            <div
              v-else
              class="classroom-empty"
            >
              <span>
                // NENHUM ALUNO ENCONTRADO
              </span>

              <h3>
                Nenhum participante corresponde
                à busca.
              </h3>
            </div>
          </section>
        </template>
      </main>

      <ActivityDialog
        v-model:visible="activityDialogVisible"
        @continue="continuarNovaTarefa"
      />
    </SidebarMain>
  </SidebarLayout>
</template>

<style src="./estilos.css"></style>
