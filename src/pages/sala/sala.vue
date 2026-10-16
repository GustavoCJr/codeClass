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
  ref,
  watch
} from 'vue'

import SidebarLayout from 'primevue/sidebarlayout'
import SidebarMain from 'primevue/sidebarmain'

import SidebarProfessor from '../../components/sidebarProfessor.vue'
import SidebarAluno from '../../components/sidebarAluno.vue'
import ActivityDialog from '../../components/classroom/ActivityDialog.vue'
import AddStudentDialog from '../../components/classroom/AddStudentDialog.vue'
import ClassroomManagement from '../../components/classroom/ClassroomManagement.vue'
import AssignmentQuickActions from '../../components/assignment/AssignmentQuickActions.vue'
import StudentQuickActions from '../../components/classroom/StudentQuickActions.vue'
import { Users, UserPlus, ListCheck, FileEdit, Search, Calendar, Book } from '@primeicons/vue'

import {
  buscarAlunosOrganizacao,
  buscarPaginaSala,
  matricularAluno,
  alunoNaPaginaSala
} from './service'

const aluno = alunoNaPaginaSala()
const dados = ref(null)
const carregando = ref(true)
const erro = ref('')

function obterAbaInicial() {
  const tab = new URLSearchParams(
    (route?.query ? new URLSearchParams(route.query).toString() : window.location.search)
  ).get('tab')

  if (
    tab === 'geral' ||
    tab === 'atividades' ||
    (tab === 'alunos' && !aluno)
  ) {
    return tab
  }

  return 'geral'
}

const abaAtiva = ref(obterAbaInicial())
const buscaAluno = ref('')
const buscaAtividade = ref('')
const filtroTipoAtividade = ref('todos')
const filtroPrazoAtividade = ref('todos')
const ordemAtividade = ref('prazo')

const activityDialogVisible = ref(false)

const addStudentDialogVisible = ref(false)
const buscaCandidato = ref('')
const candidatosAluno = ref([])
const carregandoCandidatos = ref(false)
const erroCandidatos = ref('')
const alunoAdicionandoId = ref(null)

let timerBuscaCandidatos = null
let sequenciaBuscaCandidatos = 0

function obterIdSala() {
  return new URLSearchParams(
    (route?.query ? new URLSearchParams(route.query).toString() : window.location.search)
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

function dataValida(valor) {
  if (!valor) return null
  const timestamp = Date.parse(valor)
  return Number.isFinite(timestamp) ? timestamp : null
}

const atividadesVisiveis = computed(() => {
  // A visualização do aluno continua com o comportamento original.
  if (aluno) return atividadesOrdenadas.value

  const termo = normalizarTexto(buscaAtividade.value)
  const agora = Date.now()
  return [...(dados.value?.atividades || [])]
    .filter((atividade) => {
      if (termo && !normalizarTexto(`${atividade.title || ''} ${atividade.description || ''}`).includes(termo)) return false
      if (filtroTipoAtividade.value !== 'todos' && atividade.type !== filtroTipoAtividade.value) return false

      const prazo = dataValida(atividade.deadline)
      const situacao = prazo === null ? 'sem-prazo' : prazo < agora ? 'encerrada' : 'andamento'
      return filtroPrazoAtividade.value === 'todos' || filtroPrazoAtividade.value === situacao
    })
    .sort((a, b) => {
      const prazoA = dataValida(a.deadline)
      const prazoB = dataValida(b.deadline)
      const criadoA = dataValida(a.created_at) ?? 0
      const criadoB = dataValida(b.created_at) ?? 0
      switch (ordemAtividade.value) {
        case 'recentes': return criadoB - criadoA || String(a.id).localeCompare(String(b.id))
        case 'antigas': return criadoA - criadoB || String(a.id).localeCompare(String(b.id))
        case 'az': return String(a.title || '').localeCompare(String(b.title || ''), 'pt-BR')
        case 'za': return String(b.title || '').localeCompare(String(a.title || ''), 'pt-BR')
        default:
          if (prazoA === null && prazoB === null) return criadoB - criadoA
          if (prazoA === null) return 1
          if (prazoB === null) return -1
          return prazoA - prazoB || criadoB - criadoA
      }
    })
})

const proximasAtividades = computed(() => {
  const agora = new Date()

  return atividadesOrdenadas.value
    .filter((atividade) => {
      if (aluno && statusAtividade(atividade).label === 'ENTREGUE') {
        return false
      }
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

function iniciaisPessoa(nome) {
  const partes = String(nome || '').trim().split(/\s+/).filter(Boolean)
  return partes.slice(0, 2).map(parte => parte[0]).join('').toUpperCase() || '?'
}

function removerAlunoDaLista(studentId) {
  if (!dados.value?.membros?.students) return
  dados.value.membros.students = dados.value.membros.students.filter(item => item.student_id !== studentId)
  dados.value.sala.total_students = dados.value.membros.students.length
}

const idsAlunosMatriculados = computed(() => {
  return new Set(
    (dados.value?.membros?.students || [])
      .map((aluno) => aluno.student_id)
  )
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
  if (aluno) {
    const entregue = (dados.value?.submissoes || []).some(
      (submissao) => submissao.assignment?.id === atividade.id &&
        ['pending', 'awaiting_review', 'published'].includes(submissao.status)
    )
    const atrasada = !entregue && atividade.deadline &&
      new Date(atividade.deadline) < new Date()

    return {
      label: entregue ? 'ENTREGUE' : atrasada ? 'ATRASADA' : 'PENDENTE',
      encerrada: Boolean(atrasada),
      entregue
    }
  }
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
        label: 'ENCERRADA',
        encerrada: true
      }
    : {
        label: 'EM ANDAMENTO',
        encerrada: false
      }
}

function voltarSalas(event) {
  event?.preventDefault()
  navegar('/salas.html')
}

function iniciaisSala(nome) {
  const palavras = String(nome || '').trim().split(/\s+/).filter(Boolean)
  return (palavras.length > 1 ? palavras.slice(0, 2).map(p => p[0]).join('') : (palavras[0] || 'S').slice(0, 2)).toUpperCase()
}

function atualizarAtividade(atividade) {
  if (!atividade?.id || !dados.value) return
  const index = dados.value.atividades.findIndex(item => item.id === atividade.id)
  if (index !== -1) dados.value.atividades.splice(index, 1, atividade)
}

function excluirAtividade(assignmentId) {
  if (!dados.value) return
  dados.value.atividades = dados.value.atividades.filter(item => item.id !== assignmentId)
}

function abrirAtividade(assignmentId) {
  navegar(`/atividade.html?id=${encodeURIComponent(assignmentId)}`)
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

  navegar('/criarTarefa.html')
}

function abrirAdicionarAluno() {
  buscaCandidato.value = ''
  candidatosAluno.value = []
  erroCandidatos.value = ''
  addStudentDialogVisible.value = true

  carregarCandidatos('')
}

async function carregarCandidatos(
  termo = buscaCandidato.value
) {
  const buscaAtual =
    ++sequenciaBuscaCandidatos

  carregandoCandidatos.value = true
  erroCandidatos.value = ''

  try {
    const membros =
      await buscarAlunosOrganizacao(termo)

    if (
      buscaAtual !==
      sequenciaBuscaCandidatos
    ) {
      return
    }

    candidatosAluno.value =
      membros.filter(
        (membro) =>
          !idsAlunosMatriculados.value.has(
            membro.user_id
          )
      )
  } catch (error) {
    if (
      buscaAtual !==
      sequenciaBuscaCandidatos
    ) {
      return
    }

    console.error(error)

    erroCandidatos.value =
      error instanceof Error
        ? error.message
        : 'Não foi possível buscar os alunos.'
  } finally {
    if (
      buscaAtual ===
      sequenciaBuscaCandidatos
    ) {
      carregandoCandidatos.value = false
    }
  }
}

async function adicionarAluno(aluno) {
  if (!aluno?.user_id) {
    return
  }

  alunoAdicionandoId.value =
    aluno.user_id

  erroCandidatos.value = ''

  try {
    const matricula = await matricularAluno(
      classroomId,
      aluno.user_id
    )

    const jaExiste =
      idsAlunosMatriculados.value.has(
        matricula.student_id
      )

    if (!jaExiste) {
      dados.value.membros.students.push(
        matricula
      )
    }

    dados.value.sala.total_students =
      dados.value.membros.students.length

    addStudentDialogVisible.value = false
  } catch (error) {
    console.error(error)

    erroCandidatos.value =
      error instanceof Error
        ? error.message
        : 'Não foi possível adicionar o aluno.'
  } finally {
    alunoAdicionandoId.value = null
  }
}

watch(
  buscaCandidato,
  (termo) => {
    if (!addStudentDialogVisible.value) {
      return
    }

    window.clearTimeout(
      timerBuscaCandidatos
    )

    timerBuscaCandidatos =
      window.setTimeout(
        () => carregarCandidatos(termo),
        320
      )
  }
)

watch(
  addStudentDialogVisible,
  (visible) => {
    if (visible) {
      return
    }

    window.clearTimeout(
      timerBuscaCandidatos
    )

    sequenciaBuscaCandidatos += 1

    buscaCandidato.value = ''
    candidatosAluno.value = []
    erroCandidatos.value = ''
    carregandoCandidatos.value = false
  }
)

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
  <component :is="embedded ? 'div' : SidebarLayout">
    <SidebarAluno v-if="aluno && !embedded" />
    <SidebarProfessor v-else-if="!embedded" />

    <component :is="embedded ? 'div' : SidebarMain">
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

          <a href="/salas.html" @click="voltarSalas">
            Voltar para salas
          </a>
        </div>

        <template v-else-if="dados">
          <a
            href="/salas.html"
            class="classroom-back"
            @click="voltarSalas"
          >
            ← Voltar para salas
          </a>

          <header class="classroom-header classroom-hero">
            <div class="classroom-identity" aria-hidden="true">
              {{ iniciaisSala(dados.sala.name) }}
            </div>
            <div class="classroom-header-copy">
              <span class="classroom-kicker">// SALA</span>
              <h1>{{ dados.sala.name }}</h1>
              <p>{{ dados.sala.description || 'Sem descrição cadastrada.' }}</p>
              <div class="classroom-header-meta">
                <span class="classroom-icon-label">
                  <Users :size="16" aria-hidden="true" />
                  Professor: <strong>{{ dados.sala.teacher.full_name }}</strong>
                </span>
                <span class="classroom-icon-label">
                  <UserPlus :size="16" aria-hidden="true" />
                  <strong>{{ dados.sala.total_students }}</strong>
                  {{ dados.sala.total_students === 1 ? 'aluno' : 'alunos' }}
                </span>
              </div>
            </div>
            <div v-if="!aluno" class="classroom-header-actions">
              <button type="button" class="classroom-primary-button classroom-icon-label" @click="abrirNovaTarefa">
                <ListCheck :size="18" aria-hidden="true" /> Nova tarefa
              </button>
              <button type="button" class="classroom-secondary-button classroom-icon-label" @click="abrirAdicionarAluno">
                <UserPlus :size="18" aria-hidden="true" /> Matricular alunos
              </button>
              <ClassroomManagement :classroom="dados.sala" @updated="Object.assign(dados.sala, $event)" />
            </div>
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
              v-if="!aluno"
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
                <span class="classroom-icon-label"><Users :size="19" aria-hidden="true" /> ALUNOS</span>

                <strong>
                  {{ dados.sala.total_students }}
                </strong>
              </article>

              <article class="classroom-metric">
                <span class="classroom-icon-label"><ListCheck :size="19" aria-hidden="true" /> ATIVIDADES</span>

                <strong>
                  {{ dados.atividades.length }}
                </strong>
              </article>

              <article class="classroom-metric">
                <span class="classroom-icon-label"><FileEdit :size="19" aria-hidden="true" /> PRÓXIMO PRAZO</span>

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

                  <h2 class="classroom-icon-label"><FileEdit :size="21" aria-hidden="true" /> Próximas atividades</h2>
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
                    <h3 class="classroom-icon-label">
                      <FileEdit v-if="atividade.type === 'questionnaire'" :size="17" aria-hidden="true" />
                      <ListCheck v-else :size="17" aria-hidden="true" />
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
                v-if="!aluno"
              >
                + Nova tarefa
              </button>
            </div>

            <div v-if="!aluno" class="classroom-activity-toolbar" aria-label="Filtrar atividades">
              <label class="classroom-activity-search">
                <span>Buscar atividade</span>
                <span class="classroom-activity-search-field">
                  <Search :size="17" aria-hidden="true" />
                  <input v-model="buscaAtividade" type="search" placeholder="Título ou descrição" autocomplete="off" />
                </span>
              </label>
              <label>
                <span>Tipo</span>
                <select v-model="filtroTipoAtividade">
                  <option value="todos">Todos os tipos</option>
                  <option value="questionnaire">Questionários</option>
                  <option value="code">Código</option>
                </select>
              </label>
              <label>
                <span>Prazo</span>
                <select v-model="filtroPrazoAtividade">
                  <option value="todos">Todas as situações</option>
                  <option value="andamento">Em andamento</option>
                  <option value="encerrada">Encerrada</option>
                  <option value="sem-prazo">Sem prazo</option>
                </select>
              </label>
              <label>
                <span>Ordenar por</span>
                <select v-model="ordemAtividade">
                  <option value="prazo">Prazo mais próximo</option>
                  <option value="recentes">Mais recentes</option>
                  <option value="antigas">Mais antigas</option>
                  <option value="az">Nome (A–Z)</option>
                  <option value="za">Nome (Z–A)</option>
                </select>
              </label>
            </div>
            <p v-if="!aluno && dados.atividades.length" class="classroom-activity-count" aria-live="polite">
              {{ atividadesVisiveis.length }} de {{ dados.atividades.length }} atividades
            </p>

            <div
              v-if="atividadesVisiveis.length"
              class="classroom-activity-list"
            >
              <article
                v-for="atividade in atividadesVisiveis"
                :key="atividade.id"
                class="classroom-activity classroom-activity--button classroom-activity--with-menu"
              >
                <AssignmentQuickActions
                  v-if="!aluno"
                  :assignment="atividade"
                  @updated="atualizarAtividade"
                  @deleted="excluirAtividade(atividade.id)"
                  @view="abrirAtividade(atividade.id)"
                />
                <div class="classroom-activity-open" role="button" tabindex="0"
                  :aria-label="`Abrir atividade ${atividade.title}`"
                  @click="abrirAtividade(atividade.id)"
                  @keydown.enter.prevent="abrirAtividade(atividade.id)"
                  @keydown.space.prevent="abrirAtividade(atividade.id)">
                <div class="classroom-activity-main">
                  <div class="classroom-activity-labels">
                    <span class="classroom-activity-type">
                      <Book v-if="atividade.type === 'questionnaire'" :size="14" aria-hidden="true" />
                      <FileEdit v-else :size="14" aria-hidden="true" />
                      {{ formatarTipo(atividade.type) }}
                    </span>

                    <span
                      :class="{
                        'classroom-activity-status--closed':
                          !aluno && statusAtividade(atividade).encerrada,
                        'classroom-activity-status--ongoing':
                          !aluno && statusAtividade(atividade).label === 'EM ANDAMENTO',
                        'classroom-activity-status--late': aluno && statusAtividade(atividade).encerrada,
                        'classroom-activity-status--submitted': aluno && statusAtividade(atividade).entregue
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
                    <span class="classroom-activity-meta-label"><Calendar :size="14" aria-hidden="true" /> PRAZO</span>
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
                    <span class="classroom-activity-meta-label"><ListCheck :size="14" aria-hidden="true" /> RESULTADO</span>
                    <strong>
                      {{
                        formatarLiberacao(
                          atividade.release_policy
                        )
                      }}
                    </strong>
                  </span>
                </div>
                </div>
              </article>
            </div>

            <div
              v-else
              class="classroom-empty"
            >
              <span>{{ dados.atividades.length ? '// NENHUMA ATIVIDADE ENCONTRADA' : '// SEM ATIVIDADES' }}</span>
              <h3>{{ dados.atividades.length ? 'Nenhuma atividade corresponde aos filtros.' : 'Esta sala ainda não possui tarefas.' }}</h3>
              <button v-if="dados.atividades.length && !aluno" type="button" class="classroom-link-button"
                @click="buscaAtividade = ''; filtroTipoAtividade = 'todos'; filtroPrazoAtividade = 'todos'; ordemAtividade = 'prazo'">
                Limpar filtros
              </button>

              <button
                type="button"
                class="classroom-primary-button"
                @click="abrirNovaTarefa"
                v-if="!aluno && !dados.atividades.length"
              >
                Criar primeira tarefa
              </button>
            </div>
          </section>

          <!-- ALUNOS -->

          <section
            v-else-if="abaAtiva === 'alunos' && !aluno"
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

              <button
                type="button"
                class="classroom-primary-button"
                @click="abrirAdicionarAluno"
              >
                <UserPlus :size="18" aria-hidden="true" /> Matricular aluno
              </button>
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
              <label for="student-search">Pesquisar matriculados</label>
              <div class="classroom-student-search-field">
                <Search :size="18" aria-hidden="true" />
                <input id="student-search" v-model="buscaAluno" type="search"
                  placeholder="Buscar por nome ou e-mail" autocomplete="off" />
              </div>
              <p class="classroom-student-count" aria-live="polite">
                <Users :size="15" aria-hidden="true" />
                {{ alunosFiltrados.length }} de {{ dados.membros.students.length }} matriculados
              </p>
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
                  {{ iniciaisPessoa(aluno.full_name) }}
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
                <StudentQuickActions :classroom-id="classroomId" :student="aluno" @removed="removerAlunoDaLista" />
              </article>
            </div>

            <div
              v-else
              class="classroom-empty"
            >
              <span>
                {{
                  buscaAluno
                    ? '// NENHUM ALUNO ENCONTRADO'
                    : '// SEM ALUNOS'
                }}
              </span>

              <h3>
                {{
                  buscaAluno
                    ? 'Nenhum participante corresponde à busca.'
                    : 'Esta sala ainda não possui alunos matriculados.'
                }}
              </h3>

              <button
                v-if="!buscaAluno"
                type="button"
                class="classroom-primary-button"
                @click="abrirAdicionarAluno"
              >
                Adicionar primeiro aluno
              </button>
            </div>
          </section>
        </template>
      </main>

      <ActivityDialog
        v-if="!aluno"
        v-model:visible="activityDialogVisible"
        @continue="continuarNovaTarefa"
      />

      <AddStudentDialog
        v-if="!aluno"
        v-model:visible="addStudentDialogVisible"
        v-model:search="buscaCandidato"
        :students="candidatosAluno"
        :loading="carregandoCandidatos"
        :adding-id="alunoAdicionandoId"
        :error="erroCandidatos"
        @add="adicionarAluno"
      />
    </component>
  </component>
</template>

<style src="./estilos.css"></style>
