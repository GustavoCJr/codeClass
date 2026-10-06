<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  mensagens: {
    type: Array,
    default: () => []
  },

  enviando: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['send'])

const mensagem = ref('')

const podeEnviar = computed(() => {
  return Boolean(mensagem.value.trim()) && !props.enviando
})

function formatarHora(data) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(data))
}

function enviar() {
  if (!podeEnviar.value) {
    return
  }

  emit('send', {
    content: mensagem.value.trim(),
    onSuccess: () => {
      mensagem.value = ''
    }
  })
}
</script>

<template>
  <section class="classroom-chat">
    <div class="classroom-tab-heading classroom-tab-heading--chat">
      <div>
        <span>// CANAL DA SALA</span>
        <h2>Chat</h2>
        <p>
          Mensagens da turma em ordem cronológica.
        </p>
      </div>
    </div>

    <div class="classroom-chat-window">
      <div
        v-if="mensagens.length"
        class="classroom-message-list"
      >
        <article
          v-for="mensagemItem in mensagens"
          :key="mensagemItem.id"
          :class="[
            'classroom-message',
            {
              'classroom-message--teacher': mensagemItem.senderRole === 'teacher'
            }
          ]"
        >
          <div class="classroom-message-avatar" aria-hidden="true">
            {{ mensagemItem.senderInitials }}
          </div>

          <div class="classroom-message-body">
            <div class="classroom-message-meta">
              <strong>{{ mensagemItem.senderName }}</strong>
              <span>{{ mensagemItem.senderRole === 'teacher' ? 'PROFESSOR' : 'ALUNO' }}</span>
              <span>{{ formatarHora(mensagemItem.createdAt) }}</span>
            </div>

            <p>{{ mensagemItem.content }}</p>

            <small v-if="mensagemItem.isEdited">
              editado
            </small>
          </div>
        </article>
      </div>

      <div
        v-else
        class="classroom-empty-state"
      >
        <span>// CHAT VAZIO</span>
        <h3>Envie a primeira mensagem da turma.</h3>
      </div>

      <form
        class="classroom-chat-composer"
        @submit.prevent="enviar"
      >
        <label for="classroom-chat-message">
          Mensagem
        </label>

        <div class="classroom-chat-control">
          <textarea
            id="classroom-chat-message"
            v-model="mensagem"
            rows="2"
            :disabled="enviando"
            placeholder="Escreva uma mensagem para a turma..."
          ></textarea>

          <button
            type="submit"
            :disabled="!podeEnviar"
          >
            {{ enviando ? 'Enviando...' : 'Enviar' }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>
