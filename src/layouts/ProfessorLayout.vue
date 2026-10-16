<script setup>
import SidebarLayout from 'primevue/sidebarlayout'
import SidebarMain from 'primevue/sidebarmain'
import SidebarProfessor from '../components/sidebarProfessor.vue'
</script>
<template>
  <SidebarLayout class="dashboard-layout">
    <SidebarProfessor />
    <SidebarMain>
      <router-view />
    </SidebarMain>
  </SidebarLayout>
</template>
