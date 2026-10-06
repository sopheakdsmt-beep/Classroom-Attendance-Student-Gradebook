import { seedStore } from './seed'
import type { AttendanceStatus, Classroom, Store, Subject } from './types'
import { MAX_STUDENTS } from './types'

const KEY = 'gradebook.somphuos.v1'
const STATUSES = new Set<AttendanceStatus>(['present', 'absent', 'excused'])

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return seedStore()
    const parsed = sanitizeStore(JSON.parse(raw))
    return parsed ?? seedStore()
  } catch {
    return seedStore()
  }
}

export function saveStore(store: Store): void {
  localStorage.setItem(KEY, JSON.stringify(store))
}

export function sanitizeStore(input: unknown): Store | null {
  if (!input || typeof input !== 'object') return null
  const record = input as Partial<Store>
  if (record.version !== 1 || !Array.isArray(record.classes) || record.classes.length === 0) return null
  const classes = record.classes.map((item) => sanitizeClass(item)).filter((item): item is Classroom => item !== null)
  if (classes.length === 0) return null
  const activeClassId = classes.some((item) => item.id === record.activeClassId)
    ? (record.activeClassId as string)
    : classes[0].id
  return { version: 1, activeClassId, classes }
}

function sanitizeClass(input: unknown): Classroom | null {
  if (!input || typeof input !== 'object') return null
  const classroom = input as Partial<Classroom>
  if (!classroom.id || !Array.isArray(classroom.students) || !Array.isArray(classroom.subjects)) return null
  const students = classroom.students
    .filter((student) => student && typeof student.id === 'string' && typeof student.name === 'string')
    .slice(0, MAX_STUDENTS)
    .map((student) => ({
      id: student.id,
      name: student.name,
      gender: student.gender === 'female' ? 'female' as const : 'male' as const,
    }))
  const subjects = classroom.subjects
    .filter((subject): subject is Subject => Boolean(subject && subject.id && subject.name))
    .map((subject) => ({
      id: subject.id,
      name: subject.name,
      coefficient: numberOr(subject.coefficient, 1),
      maxScore: Math.max(1, numberOr(subject.maxScore, 10)),
    }))
  const attendance: Record<string, AttendanceStatus> = {}
  for (const [key, value] of Object.entries(classroom.attendance ?? {})) {
    if (STATUSES.has(value as AttendanceStatus)) attendance[key] = value as AttendanceStatus
  }
  const grades: Record<string, number> = {}
  for (const [key, value] of Object.entries(classroom.grades ?? {})) {
    if (typeof value === 'number' && Number.isFinite(value)) grades[key] = value
  }
  return {
    id: classroom.id,
    schoolName: classroom.schoolName?.trim() || 'សាលា',
    className: classroom.className?.trim() || 'ថ្នាក់',
    teacherName: classroom.teacherName?.trim() || '',
    academicYear: classroom.academicYear?.trim() || '',
    passMark: numberOr(classroom.passMark, 5),
    officialHeader: classroom.officialHeader !== false,
    students,
    subjects,
    attendance,
    grades,
  }
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}
