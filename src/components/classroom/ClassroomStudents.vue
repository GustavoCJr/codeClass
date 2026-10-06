<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  alunos: {
    type: Array,
    default: () => []
  },

  removendoId: {
    type: String,
    default: ''
  },

  canManage: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['remove'])

const busca = ref('')

function normalizar(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

const alunosFiltrados = computed(() => {
  const termo = normalizar(busca.value)

  if (!termo) {
    return props.alunos
  }

  return props.alunos.filter((aluno) => {
    return normalizar(`${aluno.nome} ${aluno.email}`).includes(termo)
  })
})
</script>

<template>
  <section class="classroom-tab-section">
    <div class="classroom-tab-heading">
      <div>
        <span>// PARTICIPANTES</span>
        <h2>Alunos</h2>
        <p>
          {{ alunos.length }}
          {{ alunos.length === 1 ? 'aluno matriculado' : 'alunos matriculados' }}.
        </p>
      </div>

      <button
        v-if="canManage"
        class="classroom-tab-primary-action"
        type="button"
        disabled
        title="A matrícula de alunos será implementada na próxima etapa."
      >
        + Adicionar aluno
      </button>
    </div>

    <div class="classroom-student-toolbar">
      <label for="classroom-student-search">
        Buscar aluno
      </label>

      <input
        id="classroom-student-search"
        v-model="busca"
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
        :key="aluno.id"
        class="classroom-student-item"
      >
        <div class="classroom-student-avatar" aria-hidden="true">
          {{ aluno.iniciais }}
        </div>

        <div class="classroom-student-copy">
          <strong>{{ aluno.nome }}</strong>
          <span>{{ aluno.email }}</span>
        </div>

        <div class="classroom-student-meta">
          <span>
            {{ aluno.entregasConcluidas }} entregas
          </span>

          <button
            v-if="canManage"
            type="button"
            :disabled="removendoId === aluno.id"
            @click="emit('remove', aluno)"
          >
            {{ removendoId === aluno.id ? 'Removendo...' : 'Remover' }}
          </button>
        </div>
      </article>
    </div>

    <div
      v-else
      class="classroom-empty-state"
    >
      <span>// NENHUM ALUNO ENCONTRADO</span>
      <h3>Não encontramos participantes para “{{ busca }}”.</h3>
    </div>
  </section>
</template>
