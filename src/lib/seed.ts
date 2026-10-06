import { monthDays, monthKey } from './calendar'
import { attendanceKey, gradeKey } from './engine'
import type { AttendanceStatus, Classroom, Store, Subject } from './types'

const SUBJECTS: Subject[] = [
  { id: 'sub-khmer', name: 'ភាសាខ្មែរ', coefficient: 3, maxScore: 10 },
  { id: 'sub-math', name: 'គណិតវិទ្យា', coefficient: 4, maxScore: 10 },
  { id: 'sub-phys', name: 'រូបវិទ្យា', coefficient: 3, maxScore: 10 },
  { id: 'sub-chem', name: 'គីមីវិទ្យា', coefficient: 2, maxScore: 10 },
  { id: 'sub-bio', name: 'ជីវវិទ្យា', coefficient: 2, maxScore: 10 },
  { id: 'sub-hist', name: 'ប្រវត្តិវិទ្យា', coefficient: 1, maxScore: 10 },
  { id: 'sub-geo', name: 'ភូមិវិទ្យា', coefficient: 1, maxScore: 10 },
  { id: 'sub-eng', name: 'ភាសាអង់គ្លេស', coefficient: 2, maxScore: 10 },
]

const ROSTER: Array<{ name: string; gender: 'male' | 'female' }> = [
  { name: 'សុខ វិរៈ', gender: 'male' },
  { name: 'ចាន់ ដារ៉ា', gender: 'male' },
  { name: 'គឹម សុភា', gender: 'male' },
  { name: 'ហេង សុវណ្ណ', gender: 'male' },
  { name: 'លី វុទ្ធី', gender: 'male' },
  { name: 'មាស បញ្ញា', gender: 'male' },
  { name: 'នួន ចាន់ថា', gender: 'male' },
  { name: 'អ៊ុក សុខា', gender: 'male' },
  { name: 'ពេជ្រ វាសនា', gender: 'male' },
  { name: 'រស់ សុផល', gender: 'male' },
  { name: 'ស៊ុន ចាន់ណា', gender: 'male' },
  { name: 'ធី វណ្ណៈ', gender: 'male' },
  { name: 'យី សុធា', gender: 'male' },
  { name: 'ឡុង បុរី', gender: 'male' },
  { name: 'ណុប រ័ត្ន', gender: 'male' },
  { name: 'ផល សុវត្ថិ', gender: 'male' },
  { name: 'ឈួន សុខុម', gender: 'male' },
  { name: 'តាំង វិចិត្រ', gender: 'male' },
  { name: 'អ៊ុំ សំអាត', gender: 'male' },
  { name: 'វង្ស ពិសាល', gender: 'male' },
  { name: 'ចាន់ ស្រីមុំ', gender: 'female' },
  { name: 'កែវ សុភាព', gender: 'female' },
  { name: 'សុខ ម៉ាលី', gender: 'female' },
  { name: 'ហ៊ុន សុផាន់', gender: 'female' },
  { name: 'លឹម ស្រីនាង', gender: 'female' },
  { name: 'ម៉ៅ ចន្ទ្រា', gender: 'female' },
  { name: 'ណាង ពិសី', gender: 'female' },
  { name: 'អ៊ុក សោភា', gender: 'female' },
  { name: 'ពេជ្រ សុខន', gender: 'female' },
  { name: 'រ៉េត ស្រីពេជ្រ', gender: 'female' },
  { name: 'ស៊ី លក្ខិណា', gender: 'female' },
  { name: 'ធីតា វណ្ណី', gender: 'female' },
  { name: 'យូ សុជាតា', gender: 'female' },
  { name: 'ឡាច សុភ័ក្ត្រ', gender: 'female' },
  { name: 'នួន ស្រីនិច', gender: 'female' },
  { name: 'ផាន់ ច័ន្ទរស្មី', gender: 'female' },
  { name: 'ឈឿន រតនា', gender: 'female' },
  { name: 'តាត ចាន់ថុល', gender: 'female' },
  { name: 'អ៊ិន សុខលីន', gender: 'female' },
  { name: 'វ៉ាន់ ស្រីណុច', gender: 'female' },
]

const ABILITY = [
  9.4, 9.1, 8.8, 8.6, 8.4, 8.2, 8.05, 7.9, 7.75, 7.6, 7.4, 7.35, 7.2, 7.05, 6.95, 6.8, 6.7,
  6.55, 6.45, 6.3, 6.2, 6.1, 5.95, 5.85, 5.75, 5.6, 5.5, 5.4, 5.3, 5.2, 5.1, 5.0, 4.95, 6.5,
  7.5, 4.4, 4.2, 7.7, 8.0, 7.3,
]

const BIAS: Record<string, number> = {
  'sub-khmer': 0.25,
  'sub-math': 0.05,
  'sub-phys': -0.35,
  'sub-chem': -0.2,
  'sub-bio': 0.1,
  'sub-hist': 0.3,
  'sub-geo': 0.15,
  'sub-eng': -0.1,
}

const TIED_OCTOBER = [8, 7.5, 8, 7, 7.5, 8, 7, 8]

const GRADE_MONTHS: Array<[number, number]> = [
  [2026, 4],
  [2026, 5],
  [2026, 6],
  [2026, 7],
  [2026, 10],
]

export function sampleClassroom(): Classroom {
  const students = ROSTER.map((person, index) => ({
    id: `stu-${String(index + 1).padStart(2, '0')}`,
    name: person.name,
    gender: person.gender,
  }))
  const grades: Record<string, number> = {}
  for (const [year, month] of GRADE_MONTHS) {
    const key = monthKey(year, month)
    students.forEach((student, studentIndex) => {
      SUBJECTS.forEach((subject, subjectIndex) => {
        if (studentIndex === 39 && month === 10 && subject.id === 'sub-eng') return
        const score = scoreFor(student.id, studentIndex, subject.id, subjectIndex, year, month)
        grades[gradeKey(key, student.id, subject.id)] = score
      })
    })
  }

  const attendance: Record<string, AttendanceStatus> = {}
  for (const [year, month] of [
    [2026, 7],
    [2026, 10],
  ] as const) {
    for (const day of monthDays(year, month)) {
      if (day.weekend) continue
      students.forEach((student, index) => {
        attendance[attendanceKey(student.id, day.key)] = attendanceFor(student.id, index, day.key)
      })
    }
  }

  return {
    id: 'class-10a',
    schoolName: 'វិទ្យាល័យ ចេតិយ',
    className: 'ថ្នាក់ទី១០ ក',
    teacherName: 'អ្នកគ្រូ សែម សុខហេង',
    academicYear: '២០២៥-២០២៦',
    passMark: 5,
    officialHeader: true,
    students,
    subjects: SUBJECTS.map((subject) => ({ ...subject })),
    attendance,
    grades,
  }
}

export function blankClassroom(id = 'class-new'): Classroom {
  return {
    id,
    schoolName: 'វិទ្យាល័យ ចេតិយ',
    className: 'ថ្នាក់ថ្មី',
    teacherName: '',
    academicYear: '២០២៥-២០២៦',
    passMark: 5,
    officialHeader: true,
    students: [],
    subjects: SUBJECTS.map((subject) => ({ ...subject })),
    attendance: {},
    grades: {},
  }
}

export function emptyFrom(from: Classroom): Classroom {
  return {
    id: `class-${crypto.randomUUID()}`,
    schoolName: from.schoolName,
    className: 'ថ្នាក់ថ្មី',
    teacherName: from.teacherName,
    academicYear: from.academicYear,
    passMark: from.passMark,
    officialHeader: from.officialHeader,
    students: [],
    subjects: from.subjects.map((subject) => ({ ...subject })),
    attendance: {},
    grades: {},
  }
}

export function seedStore(): Store {
  const classroom = sampleClassroom()
  return { version: 1, activeClassId: classroom.id, classes: [classroom] }
}

function scoreFor(
  studentId: string,
  studentIndex: number,
  subjectId: string,
  subjectIndex: number,
  year: number,
  month: number,
): number {
  if ((studentIndex === 10 || studentIndex === 11) && month === 10) {
    return TIED_OCTOBER[subjectIndex] ?? 8
  }
  const noise = (unit(`${studentId}|${year}-${month}|${subjectId}`) - 0.5) * 0.8
  const tilt = (unit(`${studentId}|${subjectId}`) - 0.5) * 0.7
  let score = (ABILITY[studentIndex] ?? 6) + (BIAS[subjectId] ?? 0) + noise + tilt
  score = Math.round(score * 2) / 2
  score = clamp(score, 0, 10)
  if (studentIndex === 35 || studentIndex === 36) score = Math.min(score, 4.5)
  return score
}

function attendanceFor(studentId: string, index: number, date: string): AttendanceStatus {
  const roll = unit(`${studentId}|${date}|att`)
  if (index === 36) {
    if (roll < 0.3) return 'absent'
    if (roll < 0.4) return 'excused'
    return 'present'
  }
  if (roll < 0.045) return 'absent'
  if (roll < 0.08) return 'excused'
  return 'present'
}

function unit(seed: string): number {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4294967296
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
