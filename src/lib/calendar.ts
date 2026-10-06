import type { DayInfo } from './types'

export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1)
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
}

export function monthDays(year: number, month: number): DayInfo[] {
  const count = new Date(year, month, 0).getDate()
  const days: DayInfo[] = []
  for (let day = 1; day <= count; day += 1) {
    const weekday = new Date(year, month - 1, day).getDay()
    days.push({
      key: dateKey(year, month, day),
      year,
      month,
      day,
      weekday,
      weekend: weekday === 0 || weekday === 6,
      placeholder: false,
    })
  }
  return days
}

/** Monday-first weeks. Leading and trailing blanks keep the grid rectangular. */
export function monthWeeks(year: number, month: number): DayInfo[][] {
  const days = monthDays(year, month)
  if (days.length === 0) return []
  const offset = (days[0].weekday + 6) % 7
  const padded: DayInfo[] = []
  for (let index = 0; index < offset; index += 1) {
    padded.push(blankDay(year, month, index))
  }
  padded.push(...days)
  while (padded.length % 7 !== 0) {
    padded.push(blankDay(year, month, padded.length))
  }
  const weeks: DayInfo[][] = []
  for (let index = 0; index < padded.length; index += 7) {
    weeks.push(padded.slice(index, index + 7))
  }
  return weeks
}

function blankDay(year: number, month: number, salt: number): DayInfo {
  return {
    key: `blank-${year}-${month}-${salt}`,
    year,
    month,
    day: 0,
    weekday: 0,
    weekend: false,
    placeholder: true,
  }
}

export function weekContaining(year: number, month: number, day: number): number {
  const weeks = monthWeeks(year, month)
  const key = dateKey(year, month, day)
  const index = weeks.findIndex((week) => week.some((cell) => cell.key === key))
  return index < 0 ? 0 : index
}
