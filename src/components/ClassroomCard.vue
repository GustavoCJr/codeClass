<script setup>
import UsersIcon from '@primeicons/vue/users'

defineProps({
  sala: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <a
    class="classroom-card"
    :href="sala.href"
  >
    <div class="classroom-card-topline">
      <span class="classroom-card-code">
        {{ sala.codigo }}
      </span>

      <span class="classroom-card-arrow" aria-hidden="true">→</span>
    </div>

    <div class="classroom-card-content">
      <h3 class="classroom-card-title">
        {{ sala.nome }}
      </h3>

      <p class="classroom-card-description">
        {{ sala.descricao }}
      </p>

      <div class="classroom-card-meta">
        <span class="classroom-card-meta-item">
          <UsersIcon :size="15" />
          <strong>{{ sala.alunos }}</strong>
          <small>ALUNOS</small>
        </span>

        <span class="classroom-card-divider" aria-hidden="true"></span>

        <span class="classroom-card-meta-item classroom-card-meta-item--attention">
          <strong>{{ String(sala.atividadesPendentes).padStart(2, '0') }}</strong>
          <small>PENDENTES</small>
        </span>
      </div>
    </div>
  </a>
</template>

<style src="./ClassroomCard.css"></style>
