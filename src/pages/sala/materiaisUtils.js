export const LIMITE_MATERIAL_BYTES = 30 * 1024 * 1024

export function nomeMaterial(nome) {
  return String(nome || '').replace(/\\/g, '/').split('/').pop() || 'arquivo'
}

export function arquivoExistente(materiais, nome) {
  const nomeSeguro = nomeMaterial(nome)
  return (Array.isArray(materiais) ? materiais : []).some((item) => item.file_name === nomeSeguro)
}

export function validarArquivoMaterial(arquivo) {
  if (!arquivo) return 'Selecione um arquivo para enviar.'
  if (arquivo.size > LIMITE_MATERIAL_BYTES) return 'O arquivo ultrapassa o limite de 30 MB.'
  if (arquivo.size === 0) return 'O arquivo selecionado está vazio.'
  return ''
}

export function tamanhoMaterial(bytes) {
  const tamanho = Number(bytes)
  if (!Number.isFinite(tamanho) || tamanho < 0) return 'Tamanho desconhecido'
  if (tamanho < 1024) return `${Math.round(tamanho)} B`
  if (tamanho < 1024 ** 2) return `${(tamanho / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} KB`
  return `${(tamanho / 1024 ** 2).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
}

export function extensaoMaterial(nome) {
  const parte = String(nome || '').split('.').pop()
  return parte === nome ? '' : parte.toLowerCase()
}

export function categoriaMaterial(item) {
  const ext = extensaoMaterial(item?.file_name)
  const tipo = String(item?.content_type || '').toLowerCase()
  if (tipo === 'application/pdf' || ext === 'pdf') return 'PDF'
  if (tipo.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) return 'Imagem'
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'Compactado'
  if (['py', 'js', 'ts', 'java', 'cpp', 'c', 'html', 'css', 'json'].includes(ext)) return 'Código'
  if (['doc', 'docx', 'odt', 'txt', 'md'].includes(ext)) return 'Documento'
  if (['ppt', 'pptx', 'odp'].includes(ext)) return 'Apresentação'
  return 'Arquivo'
}

export function ordenarMateriais(materiais) {
  return [...(Array.isArray(materiais) ? materiais : [])].sort((a, b) => {
    const dataA = Date.parse(a.uploaded_at || '') || 0
    const dataB = Date.parse(b.uploaded_at || '') || 0
    return dataB - dataA || String(a.file_name || '').localeCompare(String(b.file_name || ''), 'pt-BR')
  })
}

export function validarUrlMaterial(url) {
  try {
    const parsed = new URL(url)
    return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : null
  } catch {
    return null
  }
}
