<script setup>
import {
  onMounted,
  ref
} from 'vue'

import SidebarLayout from 'primevue/sidebarlayout'
import SidebarMain from 'primevue/sidebarmain'

import SidebarAluno from '../../components/sidebarAluno.vue'

import {
  buscarDashboardAluno
} from './service'

const dados = ref(null)
const carregando = ref(true)
const erro = ref('')

function primeiroNome(nome) {
  return String(nome || '')
    .trim()
    .split(/\s+/)[0] || 'Aluno'
}

function formatarData(dataIso) {
  if (!dataIso) {
    return 'Sem prazo'
  }

  const data = new Date(dataIso)

  if (Number.isNaN(data.getTime())) {
    return 'Prazo indisponível'
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }
  ).format(data)
}

function formatarTipo(tipo) {
  return tipo === 'code'
    ? 'Código'
    : 'Questionário'
}

async function carregarDashboard() {
  carregando.value = true
  erro.value = ''

  try {
    dados.value =
      await buscarDashboardAluno()
  } catch (error) {
    console.error(error)

    erro.value =
      error instanceof Error
        ? error.message
        : 'Não foi possível carregar sua dashboard.'
  } finally {
    carregando.value = false
  }
}

onMounted(carregarDashboard)
</script>

<template>
  <SidebarLayout class="student-dashboard-layout">
    <SidebarAluno />

    <SidebarMain>
      <main class="student-dashboard">
        <section
          v-if="carregando"
          class="student-state"
          aria-live="polite"
        >
          <span>// CARREGANDO DASHBOARD</span>
          <h1>Organizando sua rotina...</h1>

          <div class="student-skeleton-grid">
            <i></i>
            <i></i>
            <i></i>
            <i></i>
          </div>
        </section>

        <section
          v-else-if="erro"
          class="student-state student-state--error"
          role="alert"
        >
          <span>// ERRO DE CARREGAMENTO</span>
          <h1>Não conseguimos carregar sua área.</h1>
          <p>{{ erro }}</p>

          <button
            type="button"
            class="student-button"
            @click="carregarDashboard"
          >
            Tentar novamente
          </button>
        </section>

        <template v-else>
          <header class="student-hero">
            <div>
              <div class="student-eyebrow">
                <span>ALUNO</span>
                <span>VISÃO GERAL</span>
              </div>

              <h1>
                Olá,
                <span>
                  {{ primeiroNome(dados.aluno.nome) }}.
                </span>
              </h1>

              <p>
                Veja o que está pendente, o que passou
                do prazo e acompanhe suas salas em um
                só lugar.
              </p>
            </div>

            <div class="student-institution">
              <span>// INSTITUIÇÃO</span>
              <strong>
                {{ dados.aluno.instituicao }}
              </strong>
            </div>
          </header>

          <section
            class="student-metrics"
            aria-label="Resumo do aluno"
          >
            <article class="student-metric">
              <strong>
                {{
                  String(
                    dados.indicadores.salas
                  ).padStart(2, '0')
                }}
              </strong>
              <span>MINHAS SALAS</span>
            </article>

            <article class="student-metric">
              <strong>
                {{
                  dados.indicadores.pendentes
                }}
              </strong>
              <span>TAREFAS PENDENTES</span>
            </article>

            <article
              class="student-metric student-metric--danger"
            >
              <strong>
                {{
                  dados.indicadores.atrasadas
                }}
              </strong>
              <span>ATIVIDADES ATRASADAS</span>
            </article>

            <article
              class="student-metric student-metric--success"
            >
              <strong>
                {{
                  dados.indicadores.entregues
                }}
              </strong>
              <span>ENTREGUES</span>
            </article>
          </section>

          <section
            v-if="dados.atrasadas.length"
            class="student-late"
          >
            <div class="student-late-heading">
              <div>
                <span>// ATENÇÃO</span>
                <h2>Atividades atrasadas</h2>
              </div>

              <strong>
                {{
                  dados.indicadores.atrasadas
                }}
              </strong>
            </div>

            <div class="student-late-list">
                <a
                v-for="atividade in dados.atrasadas"
                :key="atividade.id"
                :href="`/atividade.html?id=${encodeURIComponent(atividade.id)}`"
                class="student-late-item"
              >
                <div class="student-activity-index">
                  !
                </div>

                <div class="student-activity-copy">
                  <div class="student-activity-meta">
                    <span>
                      {{ atividade.salaNome }}
                    </span>

                    <span>
                      {{ formatarTipo(atividade.type) }}
                    </span>
                  </div>

                  <h3>
                    {{ atividade.title }}
                  </h3>

                  <p>
                    Prazo encerrado em
                    <strong>
                      {{ formatarData(atividade.deadline) }}
                    </strong>
                  </p>
                </div>

                <span
                  class="student-status student-status--late"
                >
                  ATRASADA
                </span>
              </a>
            </div>
          </section>

          <div class="student-main-grid">
            <section class="student-section">
              <div class="student-section-heading">
                <div>
                  <span class="student-section-number">
                    01
                  </span>

                  <h2>Próximas atividades</h2>
                </div>

                <span class="student-section-count">
                  {{ dados.proximas.length }}
                </span>
              </div>

              <div
                v-if="dados.proximas.length"
                class="student-activity-list"
              >
                <a
                  v-for="atividade in dados.proximas"
                  :key="atividade.id"
                  :href="`/atividade.html?id=${encodeURIComponent(atividade.id)}`"
                  class="student-activity-item"
                >
                  <div class="student-activity-copy">
                    <div class="student-activity-meta">
                      <span>
                        {{ atividade.salaNome }}
                      </span>

                      <span>
                        {{ formatarTipo(atividade.type) }}
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

                  <div class="student-activity-deadline">
                    <span>PRAZO</span>
                    <strong>
                      {{
                        formatarData(
                          atividade.deadline
                        )
                      }}
                    </strong>
                  </div>
                </a>
              </div>

              <div
                v-else
                class="student-empty"
              >
                <span>// TUDO EM DIA</span>
                <strong>
                  Nenhuma atividade pendente.
                </strong>
                <p>
                  Quando uma nova atividade for
                  disponibilizada, ela aparecerá aqui.
                </p>
              </div>
            </section>

            <section class="student-section">
              <div class="student-section-heading">
                <div>
                  <span class="student-section-number">
                    02
                  </span>

                  <h2>Minhas salas</h2>
                </div>

                <span class="student-section-count">
                  {{ dados.indicadores.salas }}
                </span>
              </div>

              <div
                v-if="dados.salas.length"
                class="student-room-list"
              >
                <a
                  v-for="(sala, index) in dados.salas"
                  :key="sala.id"
                  :href="`/sala.html?id=${encodeURIComponent(sala.id)}`"
                  class="student-room"
                >
                  <span class="student-room-code">
                    {{
                      String(index + 1)
                        .padStart(2, '0')
                    }}
                  </span>

                  <div>
                    <h3>{{ sala.name }}</h3>
                    <p>
                      {{
                        sala.description ||
                        'Sem descrição cadastrada.'
                      }}
                    </p>
                  </div>

                  <span class="student-room-role">
                    ALUNO
                  </span>
                </a>
              </div>

              <div
                v-else
                class="student-empty"
              >
                <span>// SEM SALAS</span>
                <strong>
                  Você ainda não está matriculado em
                  nenhuma sala.
                </strong>
              </div>
            </section>
          </div>

          <a class="student-button student-rooms-link" href="/salas.html">
            Ver todas as minhas salas
          </a>
        </template>
      </main>
    </SidebarMain>
  </SidebarLayout>
</template>

<style src="./estilos.css"></style>
