const ARABIC_CHAR_PATTERN = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/

/** True if the string contains any Arabic-script character. */
export function containsArabic(text: string): boolean {
  return ARABIC_CHAR_PATTERN.test(text)
}

export function shapeArabicLine(text: string): string {
  if (!containsArabic(text)) return text

  const tokens = text.trim().split(/\s+/).filter(Boolean)

  if (tokens.length <= 1) return text

  return [...tokens].reverse().join('  ')
}
/** Splits `word` into the fewest chunks that each fit within `maxWidth`. */
function breakLongWord(
  word: string,
  measureWidth: (text: string) => number,
  maxWidth: number
): string[] {
  const chunks: string[] = []
  let current = ''
  for (const ch of word) {
    const candidate = current + ch
    if (current !== '' && measureWidth(candidate) > maxWidth) {
      chunks.push(current)
      current = ch
    } else {
      current = candidate
    }
  }
  if (current !== '') chunks.push(current)
  return chunks
}

export function wrapAndShapeArabic(
  measureWidth: (text: string) => number,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['']

  const lines: string[] = []
  let currentLine = ''

  function flushCurrentLine() {
    if (currentLine !== '') {
      lines.push(currentLine)
      currentLine = ''
    }
  }

  for (const word of words) {
    const withWord = currentLine === '' ? word : `${currentLine} ${word}`

    if (measureWidth(withWord) <= maxWidth) {
      currentLine = withWord
      continue
    }

    // Doesn't fit appended to the current line — start a new one, unless
    // the word alone is still too wide, in which case hard-break it.
    flushCurrentLine()

    if (measureWidth(word) <= maxWidth) {
      currentLine = word
    } else {
      const chunks = breakLongWord(word, measureWidth, maxWidth)
      lines.push(...chunks.slice(0, -1))
      currentLine = chunks[chunks.length - 1] ?? ''
    }
  }
  flushCurrentLine()

  return lines.map(shapeArabicLine)
}
