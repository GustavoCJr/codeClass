<script setup>
import { useProfessorNavigation } from '../../router/professorNavigation'
const navegar = useProfessorNavigation()
const props = defineProps({ embedded: { type: Boolean, default: false } })

import { onMounted, ref } from 'vue'

import Button from 'primevue/button'
import SidebarLayout from 'primevue/sidebarlayout'
import SidebarMain from 'primevue/sidebarmain'

import BellIcon from '@primeicons/vue/bell'

import SidebarProfessor from '../../components/sidebarProfessor.vue'
import ClassroomCard from '../../components/ClassroomCard.vue'
import ActivityDialog from '../../components/classroom/ActivityDialog.vue'

import { buscarDashboardProfessor } from './service'

const dados = ref(null)
const carregando = ref(true)
const erro = ref('')

const activityDialogVisible = ref(false)

onMounted(async () => {
  try {
    dados.value = await buscarDashboardProfessor()
  } catch (error) {
    erro.value = 'Não foi possível carregar a dashboard agora.'
    console.error(error)
  } finally {
    carregando.value = false
  }
})

function abrirNovaTarefa() {
  activityDialogVisible.value = true
}

function continuarNovaTarefa(dadosIniciais) {
  sessionStorage.setItem(
    'codeclass:nova-tarefa',
    JSON.stringify(dadosIniciais)
  )

  activityDialogVisible.value = false

  navegar('/criarTarefa.html')
}
</script>

<template>
  <component :is="embedded ? 'div' : SidebarLayout" class="dashboard-layout">
    <SidebarProfessor v-if="!embedded" />

    <component :is="embedded ? 'div' : SidebarMain">
      <main class="dashboard-content">
        <section
          v-if="carregando"
          class="dashboard-state"
          aria-live="polite"
        >
          <span class="dashboard-state-kicker">
            CARREGANDO / DASHBOARD
          </span>

          <div
            class="dashboard-state-line dashboard-state-line--large"
          ></div>

          <div class="dashboard-state-line"></div>

          <div class="dashboard-state-grid">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </section>

        <section
          v-else-if="erro"
          class="dashboard-error"
          role="alert"
        >
          <span class="dashboard-error-code">
            // ERRO DE CARREGAMENTO
          </span>

          <h1>Algo não saiu como esperado.</h1>

          <p>{{ erro }}</p>
        </section>

        <template v-else>
          <p v-if="dados.avisos.length" class="dashboard-error" role="status">
            {{ dados.avisos.join(' ') }}
          </p>
          <header class="dashboard-hero">
            <div class="dashboard-hero-copy">
              <div class="dashboard-eyebrow">
                <span>PROFESSOR</span>
                <span>VISÃO GERAL</span>
              </div>

              <h1>
                Bem-vindo de volta,
                <span>{{ dados.professor.nome }}.</span>
              </h1>

              <p>
                Acompanhe o que precisa da sua atenção e continue
                seu trabalho sem perder o contexto.
              </p>
            </div>

            <div class="dashboard-hero-actions">
              <Button
                class="dashboard-notification-button"
                text
                rounded
                aria-label="Notificações"
              >
                <BellIcon :size="21" />

                <span
                  class="notification-dot"
                  aria-hidden="true"
                ></span>
              </Button>

              <a
                class="dashboard-action dashboard-action-secondary"
                :href="dados.links.todasSalas"
              >
                Ver salas
              </a>

              <button
                type="button"
                class="dashboard-action dashboard-action-primary"
                @click="abrirNovaTarefa"
              >
                <span aria-hidden="true">+</span>
                Nova tarefa
              </button>
            </div>
          </header>

          <section
            class="dashboard-metrics"
            aria-label="Resumo da dashboard"
          >
            <article class="dashboard-metric">
              <strong>{{ dados.indicadores.salasAtivas ?? '—' }}</strong>
              <span>MINHAS SALAS</span>
            </article>
            <article class="dashboard-metric dashboard-metric--attention">
              <strong>{{ dados.indicadores.correcoesPendentes ?? '—' }}</strong>
              <span>PARA CORRIGIR</span>
            </article>
          </section>

          <section class="dashboard-focus">
            <div class="dashboard-focus-heading">
              <span>// SEU FOCO AGORA</span>
              <span>PRIORIDADE 01</span>
            </div>

            <div class="dashboard-focus-body">
              <div class="dashboard-focus-copy">
                <p class="dashboard-focus-count">
                  <template v-if="dados.focoPrincipal.tipo === 'correcao'">
                    {{ dados.focoPrincipal.quantidade }} entregas aguardam sua avaliação.
                  </template>
                  <template v-else>{{ dados.focoPrincipal.sala }}</template>
                </p>

                <h2>
                  {{ dados.focoPrincipal.atividade }}
                </h2>

                <p>
                  {{ dados.focoPrincipal.sala }}

                  <span aria-hidden="true">·</span>

                  {{ dados.focoPrincipal.descricao }}
                </p>
              </div>

              <a
                class="dashboard-focus-action"
                :href="dados.focoPrincipal.href"
              >
                Corrigir agora

                <span aria-hidden="true">→</span>
              </a>
            </div>
          </section>

          <section class="dashboard-section salas-section">
            <div class="section-heading">
              <div class="section-heading-copy">
                <span class="section-number">
                  01
                </span>

                <h2>Salas recentes</h2>
              </div>

              <a
                class="section-link"
                :href="dados.links.todasSalas"
              >
                Ver todas

                <span aria-hidden="true">→</span>
              </a>
            </div>

            <div
              v-if="dados.salasRecentes.length"
              class="salas-grid"
            >
              <ClassroomCard
                v-for="sala in dados.salasRecentes"
                :key="sala.id"
                :sala="sala"
              />
            </div>

            <p
              v-else
              class="dashboard-panel-empty"
            >
              Você ainda não possui salas recentes.
            </p>
          </section>

          <div class="dashboard-work-grid">
            <section
              class="dashboard-section dashboard-panel"
            >
              <div
                class="section-heading section-heading--compact"
              >
                <div class="section-heading-copy">
                  <span class="section-number">
                    02
                  </span>

                  <h2>Correções pendentes</h2>
                </div>

                <a
                  class="section-link"
                  :href="'/correcoes.html'"
                >
                  Ver todas

                  <span aria-hidden="true">→</span>
                </a>
              </div>

              <div
                v-if="dados.correcoesPendentes.length"
                class="correction-list"
              >
                <a
                  v-for="(
                    correcao,
                    index
                  ) in dados.correcoesPendentes"
                  :key="correcao.id"
                  class="correction-item"
                  :href="correcao.href"
                >
                  <span class="correction-index">
                    {{
                      String(index + 1).padStart(
                        2,
                        '0'
                      )
                    }}
                  </span>

                  <div class="correction-copy">
                    <h3>
                      {{ correcao.atividade }}
                    </h3>

                    <p>
                      {{ correcao.sala }}
                    </p>
                  </div>

                  <div class="correction-count">
                    <strong>
                      {{ correcao.quantidade }}
                    </strong>

                    <span>AGUARDANDO</span>
                  </div>

                  <span
                    class="correction-arrow"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </a>
              </div>

              <p
                v-else
                class="dashboard-panel-empty"
              >
                {{ dados.avisos.some(aviso => aviso.includes('correções')) ? 'Correções indisponíveis no momento.' : 'Nenhuma correção pendente.' }}
              </p>
            </section>


          </div>


        </template>
      </main>
    </component>

    <ActivityDialog
      v-model:visible="activityDialogVisible"
      @continue="continuarNovaTarefa"
    />
  </component>
</template>