<script setup>

import { computed, onUnmounted, ref, watch } from 'vue'

import Button from 'primevue/button'

import BuildingIcon from '@primeicons/vue/building'

import LinkIcon from '@primeicons/vue/link'

import UserIcon from '@primeicons/vue/user'

import EnvelopeIcon from '@primeicons/vue/envelope'

import LockIcon from '@primeicons/vue/lock'

import EyeIcon from '@primeicons/vue/eye'

import EyeSlashIcon from '@primeicons/vue/eye-slash'

import CheckCircleIcon from '@primeicons/vue/check-circle'

import ArrowLeftIcon from '@primeicons/vue/arrow-left'

import logoCodeClass from '../../assets/images/logo.png'

import { registrarOrganizacao } from './service'

const nome = ref('')

const slug = ref('')

const slugEditadoManualmente = ref(false)

const responsavelNome = ref('')

const responsavelEmail = ref('')

const senha = ref('')

const confirmarSenha = ref('')

const mostrarSenha = ref(false)

const mostrarConfirmarSenha = ref(false)

const termosAceitos = ref(false)

const carregando = ref(false)

const erro = ref('')

const sucesso = ref(false)

const organizacaoCadastrada = ref(null)

const contagemRedirecionamento = ref(5)

let temporizador = null

function slugify(texto) {

  if (!texto) return ''

  return texto

    .toString()

    .normalize('NFD')

    .replace(/[\u0300-\u036f]/g, '')

    .toLowerCase()

    .trim()

    .replace(/[^a-z0-9\s-]/g, '')

    .replace(/[\s_]+/g, '-')

    .replace(/-+/g, '-')

    .replace(/^-+|-+$/g, '')

}

watch(nome, (novoNome) => {

  if (!slugEditadoManualmente.value) {

    slug.value = slugify(novoNome)

  }

})

function onSlugInput(event) {

  slugEditadoManualmente.value = true

  slug.value = slugify(event.target.value)

}

const slugValido = computed(() => {

  const s = slug.value.trim()

  if (s.length < 3 || s.length > 100) return false

  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)

})

const senhasConferem = computed(() => {

  if (!senha.value || !confirmarSenha.value) return true

  return senha.value === confirmarSenha.value

})

async function submeterCadastro() {

  erro.value = ''

  if (!nome.value.trim()) {

    erro.value = 'Informe o nome da organização.'

    return

  }

  if (nome.value.trim().length < 3) {

    erro.value = 'O nome da organização deve ter no mínimo 3 caracteres.'

    return

  }

  if (!slug.value.trim()) {

    erro.value = 'Informe o slug / identificador da organização.'

    return

  }

  if (!slugValido.value) {

    erro.value =

      'O identificador (slug) deve conter apenas letras minúsculas, números e hífens, com no mínimo 3 caracteres.'

    return

  }

  if (!responsavelNome.value.trim()) {

    erro.value = 'Informe o nome completo do responsável institucional.'

    return

  }

  if (!responsavelEmail.value.trim()) {

    erro.value = 'Informe o e-mail do responsável.'

    return

  }

  if (!senha.value || senha.value.length < 6) {

    erro.value = 'A senha de acesso deve ter no mínimo 6 caracteres.'

    return

  }

  if (senha.value !== confirmarSenha.value) {

    erro.value = 'A confirmação de senha não confere com a senha digitada.'

    return

  }

  if (!termosAceitos.value) {

    erro.value = 'É necessário concordar com os termos de uso institucional.'

    return

  }

  carregando.value = true

  try {

    const dados = await registrarOrganizacao({

      nome: nome.value,

      slug: slug.value,

      responsavelNome: responsavelNome.value,

      responsavelEmail: responsavelEmail.value,

      senha: senha.value

    })

    organizacaoCadastrada.value = dados

    sucesso.value = true

    temporizador = setInterval(() => {

      contagemRedirecionamento.value -= 1

      if (contagemRedirecionamento.value <= 0) {

        clearInterval(temporizador)

        irParaLogin()

      }

    }, 1000)

  } catch (error) {

    erro.value =

      error instanceof Error

        ? error.message

        : 'Erro ao cadastrar organização. Tente novamente.'

  } finally {

    carregando.value = false

  }

}

function irParaLogin() {

  if (temporizador) clearInterval(temporizador)

  window.location.href = '/login.html'

}

onUnmounted(() => {

  if (temporizador) clearInterval(temporizador)

})

</script>

<template>

  <div class="cadastro-page">

    <section

      class="cadastro-brand"

      aria-label="CodeClass"

    >

      <div class="cadastro-brand-content">

        <div

          class="cadastro-brand-mark"

          aria-hidden="true"

        >

          <span class="cadastro-code-bracket"><</span>

          <div class="cadastro-logo-frame">

            <img

              :src="logoCodeClass"

              alt=""

            />

          </div>

          <span class="cadastro-code-bracket">></span>

        </div>

        <div class="cadastro-brand-name">

          <span>Code</span><strong>Class</strong>

        </div>

        <p class="cadastro-brand-copy">

          Transforme o ensino de programação na sua instituição com turmas,

          tarefas automatizadas e correção assistida em tempo real.

        </p>

        <div class="cadastro-features">

          <div class="cadastro-feature-item">

            <div class="cadastro-feature-dot"></div>

            <span>Espaço exclusivo e isolado para sua escola ou universidade</span>

          </div>

          <div class="cadastro-feature-item">

            <div class="cadastro-feature-dot"></div>

            <span>Ambiente com suporte a múltiplos professores e turmas</span>

          </div>

          <div class="cadastro-feature-item">

            <div class="cadastro-feature-dot"></div>

            <span>Execução de código segura e correção de atividades</span>

          </div>

        </div>

      </div>

    </section>

    <section class="cadastro-form-area">

      <div class="cadastro-card">

        <header class="cadastro-header">

          <div class="cadastro-header-top">

            <a

              href="/login.html"

              class="cadastro-back-link"

              title="Voltar para a tela de login"

            >

              <ArrowLeftIcon :size="14" />

              <span>Voltar ao login</span>

            </a>

            <span class="cadastro-eyebrow">// CADASTRO INSTITUCIONAL</span>

          </div>

          <h1>Cadastrar Organização</h1>

          <p>

            Crie sua organização no CodeClass e configure a conta do responsável

            inicial (Owner).

          </p>

        </header>

        <main class="cadastro-card-main">

          <!-- ESTADO DE SUCESSO -->

          <div

            v-if="sucesso"

            class="cadastro-success-box"

          >

            <div class="cadastro-success-icon">

              <CheckCircleIcon :size="48" />

            </div>

            <h2>Organização Criada com Sucesso!</h2>

            <p class="cadastro-success-text">

              A organização <strong>{{ organizacaoCadastrada?.name || nome }}</strong>

              foi configurada com sucesso. O responsável

              <strong>{{ responsavelEmail }}</strong> já pode acessar a plataforma.

            </p>

            <div class="cadastro-success-details">

              <div class="cadastro-detail-item">

                <span class="label">Identificador (Slug):</span>

                <span class="value">{{ organizacaoCadastrada?.slug || slug }}</span>

              </div>

              <div class="cadastro-detail-item">

                <span class="label">Responsável:</span>

                <span class="value">{{ responsavelNome }}</span>

              </div>

            </div>

            <p class="cadastro-redirect-countdown">

              Redirecionando para o login em

              <strong>{{ contagemRedirecionamento }}s</strong>...

            </p>

            <Button

              class="cadastro-submit p-button"

              type="button"

              @click="irParaLogin"

            >

              Ir para o Login Agora

            </Button>

          </div>

          <!-- FORMULÁRIO DE CADASTRO -->

          <form

            v-else

            class="cadastro-form"

            @submit.prevent="submeterCadastro"

          >

            <!-- SEÇÃO 1: INSTITUIÇÃO -->

            <div class="form-section">

              <div class="form-section-title">

                <span class="section-number">01</span>

                <span>Dados da Instituição</span>

              </div>

              <div class="cadastro-field">

                <label for="cadastro-nome">

                  Nome da Organização

                </label>

                <div class="cadastro-input-wrap">

                  <span

                    class="cadastro-input-icon"

                    aria-hidden="true"

                  >

                    <BuildingIcon :size="18" />

                  </span>

                  <input

                    id="cadastro-nome"

                    v-model="nome"

                    type="text"

                    placeholder="Ex: Instituto Federal, Colégio Objetivo"

                    :disabled="carregando"

                    required

                  />

                </div>

              </div>

              <div class="cadastro-field">

                <div class="field-label-row">

                  <label for="cadastro-slug">

                    Slug / Identificador Único

                  </label>

                  <span class="field-hint">Apenas letras, números e hífens</span>

                </div>

                <div class="cadastro-input-wrap">

                  <span

                    class="cadastro-input-icon"

                    aria-hidden="true"

                  >

                    <LinkIcon :size="18" />

                  </span>

                  <input

                    id="cadastro-slug"

                    :value="slug"

                    type="text"

                    placeholder="ex: instituto-federal"

                    :disabled="carregando"

                    required

                    @input="onSlugInput"

                  />

                </div>

                <div

                  v-if="slug"

                  class="slug-preview"

                >

                  Identificador na plataforma:

                  <code>@{{ slug }}</code>

                </div>

              </div>

            </div>

            <!-- SEÇÃO 2: RESPONSÁVEL (OWNER) -->

            <div class="form-section">

              <div class="form-section-title">

                <span class="section-number">02</span>

                <span>Responsável Inicial (Owner)</span>

              </div>

              <div class="cadastro-field">

                <label for="cadastro-responsavel-nome">

                  Nome Completo

                </label>

                <div class="cadastro-input-wrap">

                  <span

                    class="cadastro-input-icon"

                    aria-hidden="true"

                  >

                    <UserIcon :size="18" />

                  </span>

                  <input

                    id="cadastro-responsavel-nome"

                    v-model="responsavelNome"

                    type="text"

                    placeholder="Ex: Carlos Alberto da Silva"

                    autocomplete="name"

                    :disabled="carregando"

                    required

                  />

                </div>

              </div>

              <div class="cadastro-field">

                <label for="cadastro-responsavel-email">

                  E-mail Institucional

                </label>

                <div class="cadastro-input-wrap">

                  <span

                    class="cadastro-input-icon"

                    aria-hidden="true"

                  >

                    <EnvelopeIcon :size="18" />

                  </span>

                  <input

                    id="cadastro-responsavel-email"

                    v-model="responsavelEmail"

                    type="email"

                    placeholder="carlos@instituicao.edu.br"

                    autocomplete="email"

                    :disabled="carregando"

                    required

                  />

                </div>

              </div>

              <div class="cadastro-field-grid">

                <div class="cadastro-field">

                  <label for="cadastro-senha">

                    Senha

                  </label>

                  <div class="cadastro-input-wrap">

                    <span

                      class="cadastro-input-icon"

                      aria-hidden="true"

                    >

                      <LockIcon :size="18" />

                    </span>

                    <input

                      id="cadastro-senha"

                      v-model="senha"

                      :type="mostrarSenha ? 'text' : 'password'"

                      autocomplete="new-password"

                      placeholder="Mín. 6 caracteres"

                      :disabled="carregando"

                      required

                    />

                    <button

                      class="cadastro-password-toggle"

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

                <div class="cadastro-field">

                  <label for="cadastro-confirmar-senha">

                    Confirmar Senha

                  </label>

                  <div class="cadastro-input-wrap">

                    <span

                      class="cadastro-input-icon"

                      aria-hidden="true"

                    >

                      <LockIcon :size="18" />

                    </span>

                    <input

                      id="cadastro-confirmar-senha"

                      v-model="confirmarSenha"

                      :type="mostrarConfirmarSenha ? 'text' : 'password'"

                      autocomplete="new-password"

                      placeholder="Repita a senha"

                      :disabled="carregando"

                      required

                    />

                    <button

                      class="cadastro-password-toggle"

                      type="button"

                      :aria-label="mostrarConfirmarSenha ? 'Ocultar senha' : 'Mostrar senha'"

                      :title="mostrarConfirmarSenha ? 'Ocultar senha' : 'Mostrar senha'"

                      :disabled="carregando"

                      @click="mostrarConfirmarSenha = !mostrarConfirmarSenha"

                    >

                      <EyeSlashIcon

                        v-if="mostrarConfirmarSenha"

                        :size="18"

                      />

                      <EyeIcon

                        v-else

                        :size="18"

                      />

                    </button>

                  </div>

                </div>

              </div>

              <p

                v-if="!senhasConferem"

                class="field-validation-error"

              >

                As senhas informadas não conferem.

              </p>

            </div>

            <!-- OPÇÕES E TERMOS -->

            <div class="cadastro-terms">

              <label class="cadastro-terms-label">

                <input

                  v-model="termosAceitos"

                  type="checkbox"

                  :disabled="carregando"

                  required

                />

                <span>

                  Declaro que sou representante da instituição e concordo com os

                  termos de uso do CodeClass.

                </span>

              </label>

            </div>

            <!-- MENSAGEM DE ERRO -->

            <p

              v-if="erro"

              class="cadastro-feedback cadastro-feedback--error"

              role="alert"

            >

              {{ erro }}

            </p>

            <!-- BOTÃO SUBMIT -->

            <Button

              class="cadastro-submit p-button"

              type="submit"

              :loading="carregando"

              :disabled="carregando || !senhasConferem"

            >

              {{ carregando ? 'Cadastrando Organização...' : 'Cadastrar Organização' }}

            </Button>

          </form>

        </main>

        <footer class="cadastro-footer">

          <span>

            Já possui uma instituição cadastrada?

            <a href="/login.html">Acesse sua conta</a>

          </span>

        </footer>

      </div>

    </section>

  </div>

</template>
