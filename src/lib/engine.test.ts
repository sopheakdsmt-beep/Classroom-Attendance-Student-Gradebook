import { describe, expect, it } from 'vitest'
import { monthDays } from './calendar'
import { clearMonthAttendance, cycleAttendance, fillSchoolDays, setGrade } from './edit'
import {
  classSummary,
  gpaFromAverage,
  mention,
  monthlyResult,
  nextStatus,
  rankClassroom,
  round2,
  semesterFor,
  semesterResult,
  tallyAttendance,
} from './engine'
import { fromKhmerDigits, parseScore, toKhmerNumber } from './khmer'
import { buildProgressNotice, telegramShareHref } from './report'
import { sampleClassroom } from './seed'
import type { Classroom } from './types'

function classroom(partial: Partial<Classroom> = {}): Classroom {
  return {
    id: 'c',
    schoolName: 'វិទ្យាល័យ ចេតិយ',
    className: 'ថ្នាក់ទី១០ ក',
    teacherName: 'អ្នកគ្រូ សែម សុខហេង',
    academicYear: '២០២៥-២០២៦',
    passMark: 5,
    officialHeader: true,
    students: [],
    subjects: [],
    attendance: {},
    grades: {},
    ...partial,
  }
}

describe('Khmer numerals', () => {
  it('converts integers, decimals, and Khmer input', () => {
    expect(toKhmerNumber(2026)).toBe('២០២៦')
    expect(toKhmerNumber(10.5, 1)).toBe('១០.៥')
    expect(toKhmerNumber(7.6, 2)).toBe('៧.៦០')
    expect(fromKhmerDigits('៨.៥')).toBe('8.5')
    expect(parseScore('៨.៥')).toBe(8.5)
    expect(parseScore('8,5')).toBe(8.5)
    expect(parseScore('  ')).toBeNull()
    expect(parseScore('អត់')).toBeNaN()
  })
})

describe('averages, GPA, and rank', () => {
  const subjects = [
    { id: 'kh', name: 'ភាសាខ្មែរ', coefficient: 3, maxScore: 10 },
    { id: 'ma', name: 'គណិតវិទ្យា', coefficient: 1, maxScore: 50 },
    { id: 'en', name: 'ភាសាអង់គ្លេស', coefficient: 0, maxScore: 10 },
  ]
  const students = [
    { id: 'a', name: 'សុខ វិរៈ', gender: 'male' as const },
    { id: 'b', name: 'ចាន់ ដារ៉ា', gender: 'male' as const },
    { id: 'c', name: 'កែវ សុភាព', gender: 'female' as const },
    { id: 'd', name: 'ឡាច សុភ័ក្ត្រ', gender: 'female' as const },
  ]

  function book(grades: Record<string, number>, passMark = 5): Classroom {
    return classroom({ students, subjects, grades, passMark })
  }

  it('weights coefficients and normalizes different max scores onto 10', () => {
    const result = monthlyResult(
      book({
        '2026-10|a|kh': 8,
        '2026-10|a|ma': 45,
        '2026-10|a|en': 1,
      }),
      'a',
      2026,
      10,
    )
    expect(result.average).toBe(8.25)
    expect(result.complete).toBe(true)
    expect(result.passed).toBe(true)
  })

  it('renormalizes when a subject is still blank', () => {
    const result = monthlyResult(book({ '2026-10|a|kh': 10 }), 'a', 2026, 10)
    expect(result.average).toBe(10)
    expect(result.complete).toBe(false)
    expect(result.entered).toBe(1)
    expect(result.expected).toBe(2)
  })

  it('returns null when the student has no scored subjects', () => {
    expect(monthlyResult(book({}), 'a', 2026, 10).average).toBeNull()
  })

  it('assigns competition ranks and skips the next number after a tie', () => {
    const grades: Record<string, number> = {
      '2026-10|a|kh': 9,
      '2026-10|a|ma': 45,
      '2026-07|a|kh': 9,
      '2026-07|a|ma': 45,
      '2026-10|b|kh': 8,
      '2026-10|b|ma': 40,
      '2026-07|b|kh': 8,
      '2026-07|b|ma': 40,
      '2026-10|c|kh': 8,
      '2026-10|c|ma': 40,
      '2026-07|c|kh': 6,
      '2026-07|c|ma': 30,
      '2026-10|d|kh': 4,
      '2026-10|d|ma': 20,
    }
    const rows = rankClassroom(book(grades), 2026, 10)
    expect(rows.map((row) => [row.student.id, row.monthRank])).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 2],
      ['d', 4],
    ])
    expect(rows.find((row) => row.student.id === 'd')?.monthly.passed).toBe(false)
    const summary = classSummary(rows)
    expect(summary.scored).toBe(4)
    expect(summary.passed).toBe(3)
  })

  it('averages rounded monthly scores into a semester GPA', () => {
    const grades = {
      '2026-04|a|kh': 8,
      '2026-04|a|ma': 40,
      '2026-05|a|kh': 6,
      '2026-05|a|ma': 30,
    }
    const semester = semesterResult(book(grades), 'a', 2026, 7)
    expect(semester.info.id).toBe('s2')
    expect(semester.info.carried).toBe(false)
    expect(semester.months.map((item) => item.average)).toEqual([8, 6, null, null, null])
    expect(semester.average).toBe(7)
    expect(semester.gpa).toBe(2.8)
    expect(gpaFromAverage(10)).toBe(4)
    expect(gpaFromAverage(0)).toBe(0)
  })

  it('uses the latest completed semester during September and October', () => {
    const october = semesterFor(2026, 10)
    expect(october.carried).toBe(true)
    expect(october.months[0]).toEqual({ year: 2026, month: 4 })
    const november = semesterFor(2026, 11)
    expect(november.months.map((item) => item.year)).toEqual([2026, 2026, 2027, 2027, 2027])
    const march = semesterFor(2026, 3)
    expect(march.months[0]).toEqual({ year: 2025, month: 11 })
    expect(march.months[4]).toEqual({ year: 2026, month: 3 })
  })

  it('names the mention bands', () => {
    expect(mention(9)).toBe('ល្អប្រសើរ')
    expect(mention(8.99)).toBe('ល្អណាស់')
    expect(mention(8)).toBe('ល្អណាស់')
    expect(mention(7)).toBe('ល្អ')
    expect(mention(6)).toBe('ល្អបង្គួរ')
    expect(mention(5)).toBe('មធ្យម')
    expect(mention(4.99)).toBe('ខ្សោយ')
    expect(round2(8.25)).toBe(8.25)
  })
})

describe('attendance editing', () => {
  it('cycles present, absent, excused, then clears', () => {
    expect(nextStatus(null)).toBe('present')
    expect(nextStatus('present')).toBe('absent')
    expect(nextStatus('absent')).toBe('excused')
    expect(nextStatus('excused')).toBeNull()
    const start = classroom({
      students: [{ id: 'a', name: 'សុខ វិរៈ', gender: 'male' }],
    })
    const once = cycleAttendance(start, 'a', '2026-10-05')
    expect(once.attendance['a|2026-10-05']).toBe('present')
    const twice = cycleAttendance(once, 'a', '2026-10-05')
    expect(twice.attendance['a|2026-10-05']).toBe('absent')
  })

  it('fills weekdays only and tallies just the open month', () => {
    const students = [{ id: 'a', name: 'សុខ វិរៈ', gender: 'male' as const }]
    const filled = fillSchoolDays(classroom({ students }), 2026, 10, 'present')
    expect(filled.attendance['a|2026-10-04']).toBeUndefined()
    expect(filled.attendance['a|2026-10-05']).toBe('present')
    const withOtherMonth = {
      ...filled,
      attendance: { ...filled.attendance, 'a|2026-11-02': 'absent' as const },
    }
    const tally = tallyAttendance(withOtherMonth, 'a', 2026, 10)
    const weekdays = monthDays(2026, 10).filter((day) => !day.weekend).length
    expect(tally.present).toBe(weekdays)
    expect(tally.absent).toBe(0)
    expect(new Date(2026, 9, 1).getDay()).toBe(4)
    expect(new Date(2026, 9, 6).getDay()).toBe(2)
    expect(clearMonthAttendance(withOtherMonth, 2026, 10).attendance['a|2026-11-02']).toBe('absent')
  })

  it('writes and clears a score', () => {
    const book = classroom({
      students: [{ id: 'a', name: 'សុខ វិរៈ', gender: 'male' }],
      subjects: [{ id: 'kh', name: 'ភាសាខ្មែរ', coefficient: 1, maxScore: 10 }],
    })
    const saved = setGrade(book, 2026, 10, 'a', 'kh', 8.5)
    expect(saved.grades['2026-10|a|kh']).toBe(8.5)
    expect(setGrade(saved, 2026, 10, 'a', 'kh', null).grades['2026-10|a|kh']).toBeUndefined()
  })
})

describe('sample class and parent notice', () => {
  const sample = sampleClassroom()

  it('ranks a full class and ties the scripted October pair', () => {
    expect(sample.students).toHaveLength(40)
    const rows = rankClassroom(sample, 2026, 10)
    expect(rows.filter((row) => row.monthRank !== null)).toHaveLength(40)
    const left = rows.find((row) => row.student.id === 'stu-11')
    const right = rows.find((row) => row.student.id === 'stu-12')
    expect(left?.monthly.average).toBe(right?.monthly.average)
    expect(left?.monthRank).toBe(right?.monthRank)
    const incomplete = rows.find((row) => row.student.id === 'stu-40')
    expect(incomplete?.monthly.complete).toBe(false)
    expect(incomplete?.monthly.average).not.toBeNull()
    expect(rows.filter((row) => row.monthly.passed === false).length).toBeGreaterThan(0)
    const october = semesterResult(sample, 'stu-01', 2026, 10)
    expect(october.info.carried).toBe(true)
    expect(october.months.map((item) => item.month)).toEqual([4, 5, 6, 7, 8])
    expect(october.months[4]?.average).toBeNull()
    expect(october.average).not.toBeNull()
    expect(october.gpa).not.toBeNull()
  })

  it('writes a Khmer notice that Telegram can carry', () => {
    const text = buildProgressNotice(sample, 'stu-01', 2026, 10)
    expect(text).toContain('វិទ្យាល័យ ចេតិយ')
    expect(text).toContain('សុខ វិរៈ')
    expect(text).toContain('មធ្យមភាគប្រចាំខែ')
    expect(text).toContain('មធ្យមភាគឆមាស')
    expect(text).toContain('GPA ឆមាស')
    expect(text).toContain('ចំណាត់ថ្នាក់លេខ')
    expect(text).toContain('វត្តមាន')
    expect(text).toContain('អវត្តមាន')
    expect(text).toContain('ច្បាប់')
    expect(text).toContain('លេខរៀង ១')
    const href = telegramShareHref(text)
    expect(href.startsWith('https://t.me/share/url?text=')).toBe(true)
    const decoded = decodeURIComponent(href.slice('https://t.me/share/url?text='.length))
    expect(decoded).toContain('សុខ វិរៈ')
    expect(encodeURIComponent(text).length).toBeLessThan(3500)
  })
})
