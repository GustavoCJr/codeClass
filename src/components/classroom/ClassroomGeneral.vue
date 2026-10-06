<script setup>
defineProps({
  sala: {
    type: Object,
    required: true
  },

  atividades: {
    type: Array,
    default: () => []
  },

  materiais: {
    type: Array,
    default: () => []
  },

  correcoesPendentes: {
    type: Number,
    default: 0
  },

  role: {
    type: String,
    default: 'teacher'
  },

  resumoAluno: {
    type: Object,
    default: () => ({
      entregasConcluidas: 0,
      resultadosLiberados: 0
    })
  }
})

function formatarData(data) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short'
  }).format(new Date(data))
}
</script>

<template>
  <div class="classroom-tab-stack">
    <div class="classroom-overview-grid">
      <section class="classroom-panel">
        <div class="classroom-panel-heading">
          <div>
            <span>// PRÓXIMOS PRAZOS</span>
            <h2>Atividades</h2>
          </div>
        </div>

        <div
          v-if="atividades.length"
          class="classroom-deadline-list"
        >
          <article
            v-for="atividade in atividades.slice(0, 3)"
            :key="atividade.id"
            class="classroom-deadline-item"
          >
            <div class="classroom-deadline-date">
              <strong>{{ formatarData(atividade.deadline) }}</strong>
              <span>{{ atividade.type === 'code' ? 'CÓDIGO' : 'QUESTIONÁRIO' }}</span>
            </div>

            <div class="classroom-deadline-copy">
              <h3>{{ atividade.title }}</h3>
              <p>{{ atividade.description }}</p>
            </div>

            <span class="classroom-status-badge">
              {{ atividade.entregas }}/{{ sala.alunos }} entregas
            </span>
          </article>
        </div>

        <p
          v-else
          class="classroom-panel-empty"
        >
          Nenhuma atividade cadastrada.
        </p>
      </section>

      <section class="classroom-panel">
        <div class="classroom-panel-heading">
          <div>
            <span>// APOIO PEDAGÓGICO</span>
            <h2>Materiais recentes</h2>
          </div>
        </div>

        <div
          v-if="materiais.length"
          class="classroom-material-list"
        >
          <article
            v-for="material in materiais.slice(0, 4)"
            :key="material.id"
            class="classroom-material-item"
          >
            <div>
              <strong>{{ material.nome }}</strong>
              <span>{{ material.tipo }} · {{ material.tamanho }}</span>
            </div>

            <span class="classroom-material-date">
              {{ formatarData(material.criadoEm) }}
            </span>
          </article>
        </div>

        <p
          v-else
          class="classroom-panel-empty"
        >
          Nenhum material enviado.
        </p>
      </section>
    </div>
  </div>
</template>
