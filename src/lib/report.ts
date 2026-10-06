import { mention, rankClassroom, semesterRangeLabel } from './engine'
import { KHMER_MONTHS, genderLabel, toKhmerNumber } from './khmer'
import type { Classroom } from './types'

export function telegramShareHref(text: string): string {
  return `https://t.me/share/url?text=${encodeURIComponent(text)}`
}

export function buildProgressNotice(
  classroom: Classroom,
  studentId: string,
  year: number,
  month: number,
): string {
  const ranked = rankClassroom(classroom, year, month)
  const row = ranked.find((item) => item.student.id === studentId)
  if (!row) return ''
  const monthCount = ranked.filter((item) => item.monthRank !== null).length
  const semesterCount = ranked.filter((item) => item.semesterRank !== null).length
  const roster = toKhmerNumber(row.rosterIndex + 1)
  const lines: string[] = [
    classroom.schoolName,
    `លទ្ធផលសិក្សា · ${classroom.className} · ${KHMER_MONTHS[month]} ${toKhmerNumber(year)}`,
    `${row.student.name} · ${genderLabel(row.student.gender)} · លេខរៀង ${roster}`,
    '',
  ]

  if (row.monthly.subjects.length === 0) {
    lines.push('មិនទាន់មានមុខវិជ្ជា')
  } else {
    for (const item of row.monthly.subjects) {
      const weight = `×${toKhmerNumber(item.subject.coefficient)}`
      if (item.score === null) {
        lines.push(`${item.subject.name} ${weight}: មិនទាន់មាន`)
        continue
      }
      const raw = `${formatPlain(item.score)}/${formatPlain(item.subject.maxScore)}`
      lines.push(`${item.subject.name} ${weight}: ${raw}`)
    }
  }

  lines.push('')
  if (row.monthly.average === null) {
    lines.push('មធ្យមភាគប្រចាំខែ: មិនទាន់មានពិន្ទុ')
    lines.push('ចំណាត់ថ្នាក់: មិនទាន់ចាត់')
  } else {
    lines.push(
      `មធ្យមភាគប្រចាំខែ: ${toKhmerNumber(row.monthly.average, 2)}/១០ · ${mention(row.monthly.average)}`,
    )
    lines.push(`ចំណាត់ថ្នាក់លេខ ${toKhmerNumber(row.monthRank ?? 0)}/${toKhmerNumber(monthCount)}`)
    if (!row.monthly.complete) lines.push('ពិន្ទុមិនទាន់គ្រប់មុខវិជ្ជា')
  }

  const range = semesterRangeLabel(row.semester.info)
  if (row.semester.average === null || row.semester.gpa === null) {
    lines.push(`មធ្យមភាគឆមាស: មិនទាន់មានពិន្ទុ (${row.semester.info.label} ${range})`)
  } else {
    lines.push(
      `មធ្យមភាគឆមាស ${row.semester.info.label}: ${toKhmerNumber(row.semester.average, 2)}/១០ · GPA ឆមាស ${toKhmerNumber(row.semester.gpa, 2)}/៤.០០`,
    )
    lines.push(`ចំណាត់ថ្នាក់ឆមាសលេខ ${toKhmerNumber(row.semesterRank ?? 0)}/${toKhmerNumber(semesterCount)}`)
  }

  lines.push(
    `វត្តមាន ${toKhmerNumber(row.attendance.present)} · អវត្តមាន ${toKhmerNumber(row.attendance.absent)} · ច្បាប់ ${toKhmerNumber(row.attendance.excused)}`,
  )
  lines.push(classroom.teacherName)
  return lines.join('\n')
}

export function buildAllNotices(classroom: Classroom, year: number, month: number): string {
  return classroom.students
    .map((student) => buildProgressNotice(classroom, student.id, year, month))
    .filter(Boolean)
    .join('\n\n━━━━━━━━━━━━━━━━\n\n')
}

function formatPlain(value: number): string {
  const decimals = Number.isInteger(value) ? 0 : 1
  return toKhmerNumber(value, decimals)
}
