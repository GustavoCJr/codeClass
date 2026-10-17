<script setup>
// Navegação docente: links legados são resolvidos para a SPA quando possível.
import { computed, inject, ref } from 'vue'
import { routerKey, routeLocationKey } from 'vue-router'
import { converterLinkProfessor } from '../router/professorNavigation'

import logoCodeClass from '../assets/images/logo.png'
import Sidebar from 'primevue/sidebar'
import SidebarSpacer from 'primevue/sidebarspacer'
import SidebarAside from 'primevue/sidebaraside'
import SidebarPanel from 'primevue/sidebarpanel'
import SidebarHeader from 'primevue/sidebarheader'
import SidebarContent from 'primevue/sidebarcontent'
import SidebarFooter from 'primevue/sidebarfooter'
import SidebarGroup from 'primevue/sidebargroup'
import SidebarGroupContent from 'primevue/sidebargroupcontent'
import SidebarGroupLabel from 'primevue/sidebargrouplabel'
import SidebarMenu from 'primevue/sidebarmenu'
import SidebarMenuItem from 'primevue/sidebarmenuitem'
import SidebarMenuButton from 'primevue/sidebarmenubutton'
import { supabase } from '../config/supabase'
import { obterPerfilDaPagina } from '../config/auth'

import {
  Home,
  Book,
  ListCheck,
  FileEdit,
  Comments,
  User,
  SignOut,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight
} from '@primeicons/vue'

import {
  obterTemaSalvo,
  alternarTema as alternarTemaGlobal
} from '../config/theme'

import './sidebarProfessor.css'

/* ==================================================
   ESTADO DA SIDEBAR
   ================================================== */

const router = inject(routerKey, null)
const route = inject(routeLocationKey, null)
const spaAtiva = computed(() => Boolean(router) && (route?.path?.startsWith('/professor/') || window.location.pathname.endsWith('/professor.html')))
const sidebarAberta = ref(true)


/* ==================================================
   ESTADO DO TEMA
   ================================================== */

const temaAtual = ref(obterTemaSalvo())

function trocarTema() {
  temaAtual.value = alternarTemaGlobal()
}

/* ==================================================
   NAVEGAÇÃO PRINCIPAL
   ================================================== */
const itensMenu = [
  {
    label: 'Início',
    icon: Home,
    url: '/dashboardProfessor.html'
  },
  {
    label: 'Salas',
    icon: Book,
    url: '/salas.html'
  },
  {
    label: 'Tarefas',
    icon: ListCheck,
    url: '/tarefas.html'
  },
  {
    label: 'Correções',
    icon: FileEdit,
    url: '/correcoes.html'
  },
  {
    label: 'Chat',
    icon: Comments,
    url: null
  }
]
if (['owner', 'admin'].includes(obterPerfilDaPagina()?.role)) {
  itensMenu.splice(4, 0, { label: 'Alunos', icon: User, url: '/alunos.html' })
}

/* ==================================================
   IDENTIFICA A PÁGINA ATUAL
   ================================================== */

function itemAtivo(item) {
  if (!item.url) {
    return false
  }

  const pathname = spaAtiva.value ? ({ '/professor/dashboard': '/dashboardProfessor.html', '/professor/salas': '/salas.html', '/professor/sala': '/sala.html', '/professor/tarefas': '/tarefas.html', '/professor/correcoes': '/correcoes.html', '/professor/atividade': '/atividade.html', '/professor/criar-tarefa': '/criarTarefa.html', '/professor/corrigir-entrega': '/corrigirEntrega.html', '/professor/alunos': '/alunos.html' }[route.path] || route.path) : window.location.pathname
  if (item.url === '/correcoes.html' && pathname === '/corrigirEntrega.html') return true
  if (item.url === '/tarefas.html' && ['/atividade.html', '/criarTarefa.html'].includes(pathname)) return true

  if (item.url === '/salas.html' && pathname === '/sala.html') {
    return true
  }

  return pathname === item.url
}


/* ==================================================
   NAVEGAÇÃO
   ================================================== */

function navegar(item) {
  if (!item.url) {
    return
  }

  const destino = converterLinkProfessor(item.url)
  if (destino) {
    if (spaAtiva.value && router) {
      router.push(destino)
      return
    }
    // Mesmo partindo de uma página HTML legada, abre a SPA docente.
    window.location.assign(`/professor.html#${destino}`)
    return
  }
  window.location.assign(item.url)
}

/* ==================================================
   AÇÕES DO FOOTER
   ================================================== */

function abrirPerfil() {
  if (spaAtiva.value && router) {
    router.push('/professor/perfil')
    return
  }
  window.location.href = '/professor.html#/professor/perfil'
}

async function sair() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Erro ao sair:', error)
    return
  }

  window.location.href = '/login.html'
}
</script>

<template>
  <Sidebar
    id="sidebar-professor"
    v-model:open="sidebarAberta"
    as="aside"
    aria-label="Navegação do professor"
    collapsible="icon"
    width="270px"
    iconWidth="4rem"
    class="cc-sidebar"
  >
    <SidebarSpacer />

    <SidebarAside class="cc-sidebar-aside">
      <SidebarPanel class="cc-sidebar-panel">
        <SidebarHeader class="cc-sidebar-header">
          <div class="cc-sidebar-brand">
            <div
              class="cc-sidebar-logo"
              :title="sidebarAberta ? null : 'CodeClass'"
            >
              <img
                :src="logoCodeClass"
                alt="Logo do CodeClass"
              />
            </div>
            <div class="cc-sidebar-brand-text">
              <strong>
                Code<span>Class</span>
              </strong>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent class="cc-sidebar-content">
          <SidebarGroup>

            <SidebarGroupLabel class="cc-sidebar-group-label">
              Navegação
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu class="cc-sidebar-menu">
                <SidebarMenuItem
                  v-for="item in itensMenu"
                  :key="item.label"
                >
                  <SidebarMenuButton
                    :disabled="!item.url"
                    :isActive="itemAtivo(item)"
                    :class="[
                      'cc-sidebar-button',
                      {
                        'cc-sidebar-button-active': itemAtivo(item),
                        'cc-sidebar-button-disabled': !item.url
                      }
                    ]"
                    :title="sidebarAberta ? null : item.label"
                    :aria-label="item.label"
                    @click="navegar(item)"
                  >
                    <span class="cc-sidebar-icon">
                      <component
                        :is="item.icon"
                        class="cc-sidebar-menu-icon"
                      />
                    </span>
                    <span class="cc-sidebar-text">
                      {{ item.label }}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>

          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter class="cc-sidebar-footer">
          <div class="cc-sidebar-footer-actions">
            <button
              class="cc-sidebar-footer-button cc-sidebar-collapse-button"
              type="button"
              :title="sidebarAberta ? 'Recolher sidebar' : 'Expandir sidebar'"
              :aria-label="sidebarAberta ? 'Recolher sidebar' : 'Expandir sidebar'"
              @click="sidebarAberta = !sidebarAberta"
            >
              <span class="cc-sidebar-icon">
                <ChevronLeft
                  v-if="sidebarAberta"
                  size="18"
                />
                <ChevronRight
                  v-else
                  size="18"
                />
              </span>

              <span class="cc-sidebar-text">
                Recolher
              </span>
            </button>

            <button
              class="cc-sidebar-footer-button"
              type="button"
              :title="
                sidebarAberta
                  ? null
                  : temaAtual === 'light'
                    ? 'Tema escuro'
                    : 'Tema claro'
              "
              :aria-label="
                temaAtual === 'light'
                  ? 'Ativar tema escuro'
                  : 'Ativar tema claro'
              "
              @click="trocarTema"
            >
              <span class="cc-sidebar-icon">
                <Moon
                  v-if="temaAtual === 'light'"
                  size="19"
                />
                <Sun
                  v-else
                  size="19"
                />
              </span>

              <span class="cc-sidebar-text">
                {{
                  temaAtual === 'light'
                    ? 'Tema escuro'
                    : 'Tema claro'
                }}
              </span>
            </button>

            <button
              class="cc-sidebar-footer-button"
              type="button"
              :title="sidebarAberta ? null : 'Perfil'"
              aria-label="Abrir perfil"
              :aria-current="spaAtiva && route?.path === '/professor/perfil' ? 'page' : undefined"
              :class="{ 'cc-sidebar-footer-button-active': spaAtiva && route?.path === '/professor/perfil' }"
              @click="abrirPerfil"
            >
              <span class="cc-sidebar-icon">
                <User size="19" />
              </span>

              <span class="cc-sidebar-text">
                Perfil
              </span>
            </button>

            <button
              class="cc-sidebar-footer-button cc-sidebar-logout"
              type="button"
              :title="sidebarAberta ? null : 'Sair'"
              aria-label="Sair"
              @click="sair"
            >
              <span class="cc-sidebar-icon">
                <SignOut size="19" />
              </span>

              <span class="cc-sidebar-text">
                Sair
              </span>
            </button>

          </div>
        </SidebarFooter>
      </SidebarPanel>
    </SidebarAside>
  </Sidebar>
</template>
