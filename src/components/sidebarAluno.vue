<script setup>
// CODECLASS - SIDEBAR ALUNO
// v1: estrutura inicial do aluno, compartilhando o CSS validado da sidebar do professor

import { ref } from 'vue'

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

/*
 * Reutiliza o mesmo CSS estrutural da sidebar do professor.
 * Isso preserva a solução validada com o painel visual fixo na viewport.
 */
import './sidebarProfessor.css'

/* ==================================================
   ESTADO DA SIDEBAR
   ================================================== */

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

   As páginas específicas do aluno ainda serão criadas.
   Por enquanto, apenas a Sala compartilhada possui rota ativa.
   ================================================== */

const itensMenu = [
  {
    label: 'Início',
    icon: Home,
    url: null,
    activePaths: []
  },
  {
    label: 'Salas',
    icon: Book,
    url: null,
    activePaths: ['/sala.html']
  },
  {
    label: 'Tarefas',
    icon: ListCheck,
    url: null,
    activePaths: []
  },
  {
    label: 'Resultados',
    icon: FileEdit,
    url: null,
    activePaths: []
  },
  {
    label: 'Chat',
    icon: Comments,
    url: null,
    activePaths: []
  }
]

/* ==================================================
   IDENTIFICA A PÁGINA ATUAL
   ================================================== */

function itemAtivo(item) {
  const pathname = window.location.pathname

  if (item.activePaths?.includes(pathname)) {
    return true
  }

  return Boolean(item.url && pathname === item.url)
}

/* ==================================================
   NAVEGAÇÃO
   ================================================== */

function navegar(item) {
  if (!item.url) {
    return
  }

  window.location.href = item.url
}

/* ==================================================
   AÇÕES DO FOOTER
   ================================================== */

function abrirPerfil() {
  /*
   * Futuramente:
   * window.location.href = '/perfil.html'
   */
}

function sair() {
  /*
   * Futuramente:
   * logout real via Supabase Auth.
   */
}
</script>

<template>
  <Sidebar
    id="sidebar-aluno"
    v-model:open="sidebarAberta"
    as="aside"
    aria-label="Navegação do aluno"
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
                    :isActive="itemAtivo(item)"
                    :class="[
                      'cc-sidebar-button',
                      {
                        'cc-sidebar-button-active': itemAtivo(item),
                        'cc-sidebar-button-disabled': !item.url && !itemAtivo(item)
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
