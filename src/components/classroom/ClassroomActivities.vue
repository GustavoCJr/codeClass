<script setup>
// v2: botão Nova atividade abre o mesmo dialog da sala
defineProps({
  atividades: {
    type: Array,
    default: () => []
  },

  role: {
    type: String,
    default: 'teacher'
  },

  canCreate: {
    type: Boolean,
    default: false
  },

  canSubmit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'new-assignment'
])

function formatarPrazo(data) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(data))
}
</script>

<template>
  <section class="classroom-tab-section">
    <div class="classroom-tab-heading">
      <div>
        <span>// ATIVIDADES DA TURMA</span>
        <h2>Atividades</h2>
        <p>
          Acompanhe prazos e entregas desta sala.
        </p>
      </div>

      <button
        v-if="canCreate"
        class="classroom-tab-primary-action"
        type="button"
        @click="emit('new-assignment')"
      >
        + Nova atividade
      </button>
    </div>

    <div
      v-if="atividades.length"
      class="classroom-activity-list"
    >
      <article
        v-for="atividade in atividades"
        :key="atividade.id"
        class="classroom-activity-item"
      >
        <div class="classroom-activity-main">
          <div class="classroom-activity-labels">
            <span>
              {{ atividade.type === 'code' ? 'CÓDIGO' : 'QUESTIONÁRIO' }}
            </span>
            <span>{{ atividade.statusLabel }}</span>
          </div>

          <h3>{{ atividade.title }}</h3>
          <p>{{ atividade.description }}</p>
        </div>

        <div class="classroom-activity-meta">
          <span>
            PRAZO
            <strong>{{ formatarPrazo(atividade.deadline) }}</strong>
          </span>

          <template v-if="role === 'teacher'">
            <span>
              ENTREGAS
              <strong>{{ atividade.entregas }}</strong>
            </span>

            <span>
              PENDENTES
              <strong>{{ atividade.correcoesPendentes }}</strong>
            </span>
          </template>

          <template v-else>
            <span>
              MINHA ENTREGA
              <strong>{{ atividade.studentSubmissionLabel }}</strong>
            </span>

            <button
              v-if="canSubmit && atividade.status === 'active'"
              class="classroom-activity-open"
              type="button"
              disabled
              title="A resolução da atividade será implementada na próxima etapa."
            >
              Abrir atividade
            </button>
          </template>
        </div>
      </article>
    </div>

    <div
      v-else
      class="classroom-empty-state"
    >
      <span>// SEM ATIVIDADES</span>
      <h3>Esta sala ainda não possui atividades.</h3>
    </div>
  </section>
</template>
