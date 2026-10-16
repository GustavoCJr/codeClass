<script setup>
import { useRouter } from 'vue-router'
import SidebarLayout from 'primevue/sidebarlayout'
import SidebarMain from 'primevue/sidebarmain'
import SidebarAluno from '../components/sidebarAluno.vue'
import { converterLinkAluno } from '../router/alunoNavigation'
const router = useRouter()
function interceptarLink(event) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const anchor = event.target.closest?.('a[href]')
  if (!anchor || (anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')) return
  const path = converterLinkAluno(anchor.href)
  if (path) { event.preventDefault(); router.push(path) }
}
</script>
<template>
  <SidebarLayout class="student-dashboard-layout" @click.capture="interceptarLink">
    <SidebarAluno />
    <SidebarMain>
      <router-view v-slot="{ Component, route }">
        <component :is="Component" :key="route.fullPath" />
      </router-view>
    </SidebarMain>
  </SidebarLayout>
</template>
