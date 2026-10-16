<script setup>
import { useProfessorNavigation } from '../../router/professorNavigation'
const navegar = useProfessorNavigation()
const props = defineProps({ embedded: { type: Boolean, default: false } })

import {
  computed,
  onMounted,
  ref
} from 'vue'

import SidebarLayout from 'primevue/sidebarlayout'
import SidebarMain from 'primevue/sidebarmain'

import SidebarProfessor from '../../components/sidebarProfessor.vue'
import SidebarAluno from '../../components/sidebarAluno.vue'
import { Book, Calendar, ChevronRight, Search } from '@primeicons/vue'
import ClassroomDialog from '../../components/ClassroomDialog.vue'
import ClassroomQuickActions from '../../components/classroom/ClassroomQuickActions.vue'

import {
  buscarSalas,
  criarSala,
  alunoNaPaginaSalas
} from './service'

const aluno = alunoNaPaginaSalas()
const salas = ref([])
const busca = ref('')
const ordenacao = ref('recentes')

const carregando = ref(true)
const erro = ref('')
const aviso = ref('')
function atualizarSala(sala) {
  salas.value = salas.value.map(atual => atual.id === sala.id ? { ...atual, ...sala } : atual)
}
function excluirSala(id) { salas.value = salas.value.filter(sala => sala.id !== id) }

const classroomDialogVisible = ref(false)
const salvandoSala = ref(false)
const erroClassroomDialog = ref('')

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function dataCriacao(sala) {
  const data = Date.parse(sala?.created_at || '')
  return Number.isFinite(data) ? data : null
}

function formatarDataCriacao(sala) {
  const data = dataCriacao(sala)
  if (data === null) return 'Data não informada'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(data)
}

function iniciaisDaSala(nome) {
  const palavras = String(nome || '').trim().split(/\s+/).filter(Boolean)
  return (palavras.length > 1 ? palavras[0][0] + palavras[1][0] : (palavras[0] || 'S').slice(0, 2))
    .toLocaleUpperCase('pt-BR')
}

const salasFiltradas = computed(() => {
  const termo = normalizarTexto(busca.value)
  const filtradas = salas.value.filter((sala) =>
    !termo || normalizarTexto(`${sala.name} ${sala.description || ''}`).includes(termo)
  )

  return [...filtradas].sort((a, b) => {
    if (ordenacao.value === 'az' || ordenacao.value === 'za') {
      const diferenca = String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR', {
        sensitivity: 'base', numeric: true
      })
      return (ordenacao.value === 'az' ? diferenca : -diferenca) ||
        String(a.id || '').localeCompare(String(b.id || ''))
    }

    const dataA = dataCriacao(a)
    const dataB = dataCriacao(b)
    // Salas sem data válida ficam ao final em ambas as ordenações.
    if (dataA === null && dataB !== null) return 1
    if (dataB === null && dataA !== null) return -1
    const diferenca = (dataA ?? 0) - (dataB ?? 0)
    return (ordenacao.value === 'antigas' ? diferenca : -diferenca) ||
      String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR')
  })
})

function abrirSala(sala) {
  navegar(`/sala.html?id=${encodeURIComponent(sala.id)}`)
}

function abrirDialogCriacao() {
  erroClassroomDialog.value = ''
  classroomDialogVisible.value = true
}

async function criarNovaSala(payload) {
  erroClassroomDialog.value = ''
  salvandoSala.value = true

  try {
    const novaSala = await criarSala(payload)

    classroomDialogVisible.value = false

    navegar(`/sala.html?id=${encodeURIComponent(
        novaSala.id
      )}`)
  } catch (error) {
    console.error(error)

    erroClassroomDialog.value =
      error instanceof Error
        ? error.message
        : 'Não foi possível criar a sala.'
  } finally {
    salvandoSala.value = false
  }
}

async function carregarSalas() {
  carregando.value = true
  erro.value = ''

  try {
    salas.value = await buscarSalas()
  } catch (error) {
    console.error(error)

    erro.value =
      error instanceof Error
        ? error.message
        : 'Não foi possível carregar as salas.'
  } finally {
    carregando.value = false
  }
}

onMounted(carregarSalas)
</script>

<template>
  <component :is="embedded ? 'div' : SidebarLayout">
    <SidebarAluno v-if="aluno && !embedded" />
    <SidebarProfessor v-else-if="!embedded" />

    <component :is="embedded ? 'div' : SidebarMain">
      <main class="salas-page">
        <header class="salas-header">
          <div class="salas-header-copy">
            <span>// SALAS</span>

            <h1>{{ aluno ? 'Minhas salas' : 'Suas salas' }}</h1>

            <p>
              {{ aluno
                ? 'Acesse as turmas em que você está matriculado.'
                : 'Acesse as turmas das quais você participa como professor.' }}
            </p>
          </div>

          <button
            type="button"
            class="salas-create-button"
            v-if="!aluno"
            @click="abrirDialogCriacao"
          >
            <span aria-hidden="true">+</span>
            Nova sala
          </button>
        </header>

        <section
          v-if="carregando"
          class="salas-state"
        >
          Carregando salas...
        </section>

        <section
          v-else-if="erro"
          class="salas-state salas-state--error"
        >
          <p>{{ erro }}</p>

          <button
            type="button"
            @click="carregarSalas"
          >
            Tentar novamente
          </button>
        </section>

        <template v-else>
          <p v-if="aviso" class="salas-notice" role="status">{{ aviso }}</p>
          <div class="salas-toolbar">
            <div class="salas-control salas-search-control">
              <label for="salas-search">Buscar sala</label>
              <div class="salas-input-wrap">
                <Search class="salas-control-icon" aria-hidden="true" />
                <input
                  id="salas-search"
                  v-model="busca"
                  type="search"
                  placeholder="Nome ou descrição"
                  autocomplete="off"
                />
              </div>
            </div>
            <div class="salas-control salas-order-control">
              <label for="salas-ordenacao">Ordenar por</label>
              <select id="salas-ordenacao" v-model="ordenacao">
                <option value="recentes">Mais recentes</option>
                <option value="antigas">Mais antigas</option>
                <option value="az">Nome (A–Z)</option>
                <option value="za">Nome (Z–A)</option>
              </select>
            </div>
          </div>

          <section>
            <div class="salas-section-header">
              <h2>Todas as salas</h2>

              <span>
                {{ salasFiltradas.length }}
              </span>
            </div>

            <div
              v-if="salasFiltradas.length"
              class="salas-grid"
            >
              <article
                v-for="sala in salasFiltradas"
                :key="sala.id"
                class="sala-card"
              >
                <button type="button" class="sala-card-main" :aria-label="`Abrir sala ${sala.name}`" @click="abrirSala(sala)">
                <div class="sala-card-top">
                  <span class="sala-card-monogram" aria-hidden="true">{{ iniciaisDaSala(sala.name) }}</span>
                  <Book class="sala-card-top-icon" aria-hidden="true" />
                </div>

                <div class="sala-card-body">
                  <span class="sala-card-label">SALA</span>
                  <h3>{{ sala.name }}</h3>
                  <p>{{ sala.description || 'Sem descrição cadastrada.' }}</p>
                </div>

                <div class="sala-card-footer">
                  <span class="sala-card-date">
                    <Calendar aria-hidden="true" />
                    <span>{{ formatarDataCriacao(sala) }}</span>
                  </span>
                  <span class="sala-card-open">
                    Abrir sala
                    <ChevronRight aria-hidden="true" />
                  </span>
                </div>
                </button>
                <ClassroomQuickActions
                  v-if="!aluno"
                  :classroom="sala"
                  @updated="atualizarSala"
                  @deleted="excluirSala"
                  @notice="aviso = $event"
                />
              </article>
            </div>

            <div
              v-else-if="busca"
              class="salas-empty"
            >
              Nenhuma sala encontrada para
              “{{ busca }}”.
            </div>

            <div
              v-else
              class="salas-empty salas-empty--create"
            >
              <span class="salas-empty-kicker">
                // PRIMEIRA SALA
              </span>

              <strong>
                {{ aluno
                  ? 'Você ainda não está matriculado em nenhuma sala.'
                  : 'Você ainda não possui salas.' }}
              </strong>

              <p>
                {{ aluno
                  ? 'Suas salas aparecerão aqui quando você for matriculado.'
                  : 'Crie uma sala para organizar alunos, atividades e entregas.' }}
              </p>

              <button
                type="button"
                class="salas-empty-button"
                v-if="!aluno"
                @click="abrirDialogCriacao"
              >
                Criar primeira sala
              </button>
            </div>
          </section>
        </template>
      </main>
    </component>

    <ClassroomDialog
      v-if="!aluno"
      v-model:visible="classroomDialogVisible"
      mode="create"
      :saving="salvandoSala"
      :error="erroClassroomDialog"
      @submit="criarNovaSala"
    />
  </component>
</template>

<style src="./estilos.css"></style>
