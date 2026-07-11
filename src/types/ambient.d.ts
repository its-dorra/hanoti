/**
 * Ambient type declarations for JS-only packages used in Arabic PDF
 * shaping that don't ship their own TypeScript types.
 */
declare module 'arabic-reshaper' {
  const ArabicReshaper: {
    convertArabic(text: string): string
  }
  export default ArabicReshaper
}

declare module 'bidi-js' {
  interface EmbeddingLevels {
    levels: Uint8Array
    paragraphs: Array<{ start: number; end: number; level: number }>
  }
  interface Bidi {
    getEmbeddingLevels(text: string, direction?: 'ltr' | 'rtl'): EmbeddingLevels
    getReorderSegments(
      text: string,
      embeddingLevels: EmbeddingLevels,
      start?: number,
      end?: number
    ): Array<[number, number]>
    getMirroredCharactersMap(
      text: string,
      embeddingLevels: EmbeddingLevels,
      start?: number,
      end?: number
    ): Map<number, string>
  }
  export default function bidiFactory(): Bidi
}
