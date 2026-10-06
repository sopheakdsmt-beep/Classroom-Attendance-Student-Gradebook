export function downloadText(filename: string, text: string, options?: { bom?: boolean; mime?: string }): void {
  const mime = options?.mime ?? 'text/plain;charset=utf-8'
  const payload = options?.bom ? `\uFEFF${text}` : text
  const url = URL.createObjectURL(new Blob([payload], { type: mime }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
