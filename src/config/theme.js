const THEME_STORAGE_KEY = 'codeclass-theme'

const THEME_LIGHT = 'light'
const THEME_DARK = 'dark'


export function obterTemaSalvo() {
  const temaSalvo = localStorage.getItem(THEME_STORAGE_KEY)

  if (temaSalvo === THEME_DARK) {
    return THEME_DARK
  }

  return THEME_LIGHT
}


export function aplicarTema(tema) {
  const temaValido =
    tema === THEME_DARK
      ? THEME_DARK
      : THEME_LIGHT

  document.documentElement.setAttribute(
    'data-theme',
    temaValido
  )

  localStorage.setItem(
    THEME_STORAGE_KEY,
    temaValido
  )

  return temaValido
}


export function inicializarTema() {
  const tema = obterTemaSalvo()

  document.documentElement.setAttribute(
    'data-theme',
    tema
  )

  return tema
}


export function alternarTema() {
  const temaAtual =
    document.documentElement.getAttribute('data-theme')

  const novoTema =
    temaAtual === THEME_DARK
      ? THEME_LIGHT
      : THEME_DARK

  return aplicarTema(novoTema)
}