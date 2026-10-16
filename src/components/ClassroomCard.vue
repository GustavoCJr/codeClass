<script setup>

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
    </div>
  </a>
</template>

<style src="./ClassroomCard.css"></style>
