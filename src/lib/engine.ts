import { monthDays, monthKey } from './calendar'
import { KHMER_MONTHS, toKhmerNumber } from './khmer'
import type {
  AttendanceStatus,
  AttendanceTally,
  Classroom,
  MonthlyResult,
  RankedStudent,
  SemesterInfo,
  SemesterResult,
} from './types'

export const FORMULA_TEXT =
  'មធ្យមភាគ = ផលបូក (ពិន្ទុ ÷ ពិន្ទុអតិបរមា × ១០ × មេគុណ) ÷ ផលបូកមេគុណ។ មធ្យមភាគឆមាស = មធ្យមនៃមធ្យមភាគប្រចាំខែដែលមានពិន្ទុ។ GPA = មធ្យមភាគឆមាស ÷ ១០ × ៤។ បើពិន្ទុស្មើគ្នា ចំណាត់ថ្នាក់លេខដូចគ្នា ហើយលេខបន្ទាប់ត្រូវរំលង។'

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function attendanceKey(studentId: string, date: string): string {
  return `${studentId}|${date}`
}

export function gradeKey(month: string, studentId: string, subjectId: string): string {
  return `${month}|${studentId}|${subjectId}`
}

export function nextStatus(current: AttendanceStatus | null): AttendanceStatus | null {
  if (current === null) return 'present'
  if (current === 'present') return 'absent'
  if (current === 'absent') return 'excused'
  return null
}

export function mention(average: number): string {
  if (average >= 9) return 'ល្អប្រសើរ'
  if (average >= 8) return 'ល្អណាស់'
  if (average >= 7) return 'ល្អ'
  if (average >= 6) return 'ល្អបង្គួរ'
  if (average >= 5) return 'មធ្យម'
  return 'ខ្សោយ'
}

export function gpaFromAverage(average: number): number {
  return round2((average / 10) * 4)
}

export function monthlyResult(
  classroom: Classroom,
  studentId: string,
  year: number,
  month: number,
): MonthlyResult {
  const key = monthKey(year, month)
  let weighted = 0
  let coefficientTotal = 0
  let entered = 0
  let expected = 0
  const subjects = classroom.subjects.map((subject) => {
    const counts = subject.coefficient > 0 && subject.maxScore > 0
    if (counts) expected += 1
    const stored = classroom.grades[gradeKey(key, studentId, subject.id)]
    const score = stored === undefined ? null : stored
    if (score !== null && counts) {
      entered += 1
      const normalized = (score / subject.maxScore) * 10
      weighted += normalized * subject.coefficient
      coefficientTotal += subject.coefficient
    }
    return {
      subject,
      score,
      normalized: score === null || subject.maxScore <= 0 ? null : (score / subject.maxScore) * 10,
    }
  })
  const average = coefficientTotal === 0 ? null : round2(weighted / coefficientTotal)
  return {
    average,
    entered,
    expected,
    complete: expected > 0 && entered === expected,
    passed: average === null ? null : average >= classroom.passMark,
    subjects,
  }
}

/** Semester that should drive GPA for the month currently on screen. */
export function semesterFor(year: number, month: number): SemesterInfo {
  if (month >= 4 && month <= 8) {
    return {
      id: 's2',
      label: 'ឆមាសទី២',
      carried: false,
      months: [4, 5, 6, 7, 8].map((item) => ({ year, month: item })),
    }
  }
  if (month >= 11) {
    return {
      id: 's1',
      label: 'ឆមាសទី១',
      carried: false,
      months: [
        { year, month: 11 },
        { year, month: 12 },
        { year: year + 1, month: 1 },
        { year: year + 1, month: 2 },
        { year: year + 1, month: 3 },
      ],
    }
  }
  if (month <= 3) {
    return {
      id: 's1',
      label: 'ឆមាសទី១',
      carried: false,
      months: [
        { year: year - 1, month: 11 },
        { year: year - 1, month: 12 },
        { year, month: 1 },
        { year, month: 2 },
        { year, month: 3 },
      ],
    }
  }
  return {
    id: 's2',
    label: 'ឆមាសទី២',
    carried: true,
    months: [4, 5, 6, 7, 8].map((item) => ({ year, month: item })),
  }
}

export function semesterRangeLabel(info: SemesterInfo): string {
  const first = info.months[0]
  const last = info.months[info.months.length - 1]
  if (!first || !last) return info.label
  if (first.year === last.year) {
    return `${KHMER_MONTHS[first.month]}–${KHMER_MONTHS[last.month]} ${toKhmerNumber(first.year)}`
  }
  return `${KHMER_MONTHS[first.month]} ${toKhmerNumber(first.year)}–${KHMER_MONTHS[last.month]} ${toKhmerNumber(last.year)}`
}

export function semesterResult(
  classroom: Classroom,
  studentId: string,
  year: number,
  month: number,
): SemesterResult {
  const info = semesterFor(year, month)
  const months = info.months.map((item) => ({
    year: item.year,
    month: item.month,
    average: monthlyResult(classroom, studentId, item.year, item.month).average,
  }))
  const recorded = months.filter((item) => item.average !== null).map((item) => item.average as number)
  const average = recorded.length === 0 ? null : round2(recorded.reduce((sum, value) => sum + value, 0) / recorded.length)
  return {
    info,
    average,
    gpa: average === null ? null : gpaFromAverage(average),
    passed: average === null ? null : average >= classroom.passMark,
    months,
  }
}

export function tallyAttendance(
  classroom: Classroom,
  studentId: string,
  year: number,
  month: number,
): AttendanceTally {
  const tally: AttendanceTally = { present: 0, absent: 0, excused: 0, marked: 0 }
  for (const day of monthDays(year, month)) {
    const status = classroom.attendance[attendanceKey(studentId, day.key)]
    if (!status) continue
    tally[status] += 1
    tally.marked += 1
  }
  return tally
}

export function classAttendance(classroom: Classroom, year: number, month: number): AttendanceTally {
  return classroom.students.reduce<AttendanceTally>(
    (sum, student) => {
      const tally = tallyAttendance(classroom, student.id, year, month)
      sum.present += tally.present
      sum.absent += tally.absent
      sum.excused += tally.excused
      sum.marked += tally.marked
      return sum
    },
    { present: 0, absent: 0, excused: 0, marked: 0 },
  )
}

function assignRanks(averages: Array<number | null>): Array<number | null> {
  const ranked = averages
    .map((average, index) => ({ average, index }))
    .filter((row): row is { average: number; index: number } => row.average !== null)
    .sort((a, b) => b.average - a.average || a.index - b.index)
  const ranks = averages.map(() => null as number | null)
  let last: number | null = null
  let rank = 0
  ranked.forEach((row, order) => {
    if (last === null || row.average !== last) {
      rank = order + 1
      last = row.average
    }
    ranks[row.index] = rank
  })
  return ranks
}

export function rankClassroom(classroom: Classroom, year: number, month: number): RankedStudent[] {
  const rows: RankedStudent[] = classroom.students.map((student, rosterIndex) => ({
    student,
    rosterIndex,
    monthly: monthlyResult(classroom, student.id, year, month),
    semester: semesterResult(classroom, student.id, year, month),
    attendance: tallyAttendance(classroom, student.id, year, month),
    monthRank: null,
    semesterRank: null,
  }))
  const monthRanks = assignRanks(rows.map((row) => row.monthly.average))
  const semesterRanks = assignRanks(rows.map((row) => row.semester.average))
  rows.forEach((row, index) => {
    row.monthRank = monthRanks[index]
    row.semesterRank = semesterRanks[index]
  })
  return rows
}

export function classSummary(rows: RankedStudent[]) {
  const scored = rows.filter((row) => row.monthly.average !== null)
  const averages = scored.map((row) => row.monthly.average as number)
  const semesterAverages = rows
    .map((row) => row.semester.average)
    .filter((value): value is number => value !== null)
  return {
    scored: scored.length,
    passed: scored.filter((row) => row.monthly.passed).length,
    monthAverage: averages.length === 0 ? null : round2(averages.reduce((sum, value) => sum + value, 0) / averages.length),
    semesterAverage:
      semesterAverages.length === 0
        ? null
        : round2(semesterAverages.reduce((sum, value) => sum + value, 0) / semesterAverages.length),
    highest: averages.length === 0 ? null : Math.max(...averages),
    lowest: averages.length === 0 ? null : Math.min(...averages),
  }
}
