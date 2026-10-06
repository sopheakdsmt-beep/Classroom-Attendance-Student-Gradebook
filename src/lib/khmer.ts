const KHMER_DIGITS = '០១២៣៤៥៦៧៨៩'

export const KHMER_MONTHS = [
  '',
  'មករា',
  'កុម្ភៈ',
  'មីនា',
  'មេសា',
  'ឧសភា',
  'មិថុនា',
  'កក្កដា',
  'សីហា',
  'កញ្ញា',
  'តុលា',
  'វិច្ឆិកា',
  'ធ្នូ',
] as const

export const WEEKDAY_SHORT = ['អា', 'ច', 'អ', 'ព', 'ព្រ', 'សុ', 'សៅ'] as const

export const WEEKDAY_LONG = [
  'អាទិត្យ',
  'ចន្ទ',
  'អង្គារ',
  'ពុធ',
  'ព្រហស្បតិ៍',
  'សុក្រ',
  'សៅរ៍',
] as const

export const STATUS_LABEL = {
  present: 'វត្តមាន',
  absent: 'អវត្តមាន',
  excused: 'ច្បាប់',
} as const

export const STATUS_GLYPH = {
  present: 'វ',
  absent: 'អ',
  excused: 'ច',
} as const

export function toKhmerDigits(value: string): string {
  return value.replace(/\d/g, (digit) => KHMER_DIGITS[Number(digit)] ?? digit)
}

export function toKhmerNumber(value: number, decimals?: number): string {
  const text = decimals === undefined ? String(value) : value.toFixed(decimals)
  return toKhmerDigits(text)
}

export function fromKhmerDigits(value: string): string {
  return value.replace(/[០-៩]/g, (ch) => String(KHMER_DIGITS.indexOf(ch)))
}

/** Empty input clears a score. Invalid text returns NaN. */
export function parseScore(raw: string): number | null {
  const cleaned = fromKhmerDigits(raw).replace(/,/g, '.').replace(/\s/g, '').trim()
  if (!cleaned) return null
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return Number.NaN
  return Number(cleaned)
}

export function formatAverage(value: number | null): string {
  if (value === null) return '—'
  return toKhmerNumber(value, 2)
}

export function formatRank(rank: number | null): string {
  if (rank === null) return '—'
  return toKhmerNumber(rank)
}

export function formatScore(value: number): string {
  const decimals = Number.isInteger(value) ? 0 : 1
  return toKhmerNumber(value, decimals)
}

export function genderLabel(gender: 'male' | 'female'): string {
  return gender === 'female' ? 'ស្រី' : 'ប្រុស'
}
