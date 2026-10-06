<script setup>
import { ref } from 'vue'

import Button from 'primevue/button'

import UserIcon from '@primeicons/vue/user'
import LockIcon from '@primeicons/vue/lock'
import EyeIcon from '@primeicons/vue/eye'
import EyeSlashIcon from '@primeicons/vue/eye-slash'

import logoCodeClass from '../../assets/images/logo.png'

import { autenticarUsuario } from './service'

const identificador = ref('')
const senha = ref('')
const manterConectado = ref(false)
const mostrarSenha = ref(false)

const carregando = ref(false)
const erro = ref('')
const mensagem = ref('')

async function entrar() {
  erro.value = ''
  mensagem.value = ''

  if (!identificador.value.trim() || !senha.value) {
    erro.value = 'Informe seu usuário ou e-mail e sua senha.'
    return
  }

  carregando.value = true

  try {
    const resposta = await autenticarUsuario({
      identificador: identificador.value,
      senha: senha.value,
      manterConectado: manterConectado.value
    })

    if (resposta.redirectUrl) {
      window.location.href = resposta.redirectUrl
      return
    }

    mensagem.value = resposta.mensagem
  } catch (error) {
    erro.value =
      error instanceof Error
        ? error.message
        : 'Não foi possível entrar agora. Tente novamente.'
  } finally {
    carregando.value = false
  }
}

function informarRecuperacao() {
  erro.value = ''
  mensagem.value =
    'A recuperação de senha será integrada quando o fluxo de autenticação institucional for definido.'
}
</script>

<template>
  <div class="login-page">
    <section
      class="login-brand"
      aria-label="CodeClass"
    >
      <div class="login-brand-content">
        <div
          class="login-brand-mark"
          aria-hidden="true"
        >
          <span class="login-code-bracket">&lt;</span>

          <div class="login-logo-frame">
            <img
              :src="logoCodeClass"
              alt=""
            />
          </div>

          <span class="login-code-bracket">&gt;</span>
        </div>

        <div class="login-brand-name">
          <span>Code</span><strong>Class</strong>
        </div>

        <p class="login-brand-copy">
          Ensino de programação organizado para sua instituição.
        </p>
      </div>
    </section>

    <section class="login-form-area">
      <div class="login-card">
        <header class="login-header">
          <span class="login-eyebrow">// ACESSO INSTITUCIONAL</span>
          <h1>Entrar</h1>
        </header>

        <main class="login-card-main">
          <form
            class="login-form"
            @submit.prevent="entrar"
          >
            <div class="login-field">
              <label for="login-identificador">
                Usuário ou e-mail
              </label>

              <div class="login-input-wrap">
                <span
                  class="login-input-icon"
                  aria-hidden="true"
                >
                  <UserIcon :size="18" />
                </span>

                <input
                  id="login-identificador"
                  v-model="identificador"
                  name="username"
                  type="text"
                  autocomplete="username"
                  placeholder="Digite seu usuário ou e-mail"
                  :disabled="carregando"
                />
              </div>
            </div>

            <div class="login-field">
              <label for="login-senha">
                Senha
              </label>

              <div class="login-input-wrap">
                <span
                  class="login-input-icon"
                  aria-hidden="true"
                >
                  <LockIcon :size="18" />
                </span>

                <input
                  id="login-senha"
                  v-model="senha"
                  name="password"
                  :type="mostrarSenha ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="Digite sua senha"
                  :disabled="carregando"
                />

                <button
                  class="login-password-toggle"
                  type="button"
                  :aria-label="mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'"
                  :title="mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'"
                  :disabled="carregando"
                  @click="mostrarSenha = !mostrarSenha"
                >
                  <EyeSlashIcon
                    v-if="mostrarSenha"
                    :size="18"
                  />

                  <EyeIcon
                    v-else
                    :size="18"
                  />
                </button>
              </div>
            </div>

            <div class="login-options">
              <label class="login-remember">
                <input
                  v-model="manterConectado"
                  type="checkbox"
                  :disabled="carregando"
                />

                <span>Manter conectado</span>
              </label>

              <button
                class="login-forgot"
                type="button"
                :disabled="carregando"
                @click="informarRecuperacao"
              >
                Esqueceu a senha?
              </button>
            </div>

            <p
              v-if="erro"
              class="login-feedback login-feedback--error"
              role="alert"
            >
              {{ erro }}
            </p>

            <p
              v-else-if="mensagem"
              class="login-feedback login-feedback--info"
              aria-live="polite"
            >
              {{ mensagem }}
            </p>

            <Button
              class="login-submit"
              type="submit"
              :loading="carregando"
              :disabled="carregando"
            >
              {{ carregando ? 'Entrando...' : 'Entrar' }}
            </Button>
          </form>
        </main>

        <footer class="login-footer">
          <span>
            Seu acesso e suas permissões são definidos pela sua instituição.
          </span>
        </footer>
      </div>
    </section>
  </div>
</template>
