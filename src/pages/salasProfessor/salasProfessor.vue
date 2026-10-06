<script setup>
import {
  computed,
  onMounted,
  ref
} from 'vue'

import SidebarLayout from 'primevue/sidebarlayout'
import SidebarMain from 'primevue/sidebarmain'

import SidebarProfessor from '../../components/sidebarProfessor.vue'

import { buscarSalas } from './service'

const salas = ref([])
const busca = ref('')

const carregando = ref(true)
const erro = ref('')

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

const salasFiltradas = computed(() => {
  const termo = normalizarTexto(busca.value)

  if (!termo) {
    return salas.value
  }

  return salas.value.filter((sala) => {
    return normalizarTexto(
      `${sala.name} ${sala.description || ''}`
    ).includes(termo)
  })
})

function abrirSala(sala) {
  window.location.href =
    `/sala.html?id=${encodeURIComponent(sala.id)}`
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
  <SidebarLayout>
    <SidebarProfessor />

    <SidebarMain>
      <main class="salas-page">
        <header class="salas-header">
          <span>// SALAS</span>

          <h1>Suas salas</h1>

          <p>
            Acesse as turmas das quais você participa
            como professor.
          </p>
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
          <div class="salas-toolbar">
            <label for="salas-search">
              Buscar sala
            </label>

            <input
              id="salas-search"
              v-model="busca"
              type="search"
              placeholder="Nome ou descrição"
              autocomplete="off"
            />
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
              <button
                v-for="sala in salasFiltradas"
                :key="sala.id"
                type="button"
                class="sala-card"
                @click="abrirSala(sala)"
              >
                <div>
                  <span class="sala-card-label">
                    SALA
                  </span>

                  <h3>
                    {{ sala.name }}
                  </h3>

                  <p>
                    {{
                      sala.description ||
                      'Sem descrição cadastrada.'
                    }}
                  </p>
                </div>

                <span
                  class="sala-card-arrow"
                  aria-hidden="true"
                >
                  →
                </span>
              </button>
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
              class="salas-empty"
            >
              Nenhuma sala encontrada.
            </div>
          </section>
        </template>
      </main>
    </SidebarMain>
  </SidebarLayout>
</template>

<style src="./estilos.css"></style>
