export const MAX_STUDENTS = 40

export type AttendanceStatus = 'present' | 'absent' | 'excused'

export type Gender = 'male' | 'female'

export interface Student {
  id: string
  name: string
  gender: Gender
}

export interface Subject {
  id: string
  name: string
  coefficient: number
  maxScore: number
}

export interface Classroom {
  id: string
  schoolName: string
  className: string
  teacherName: string
  academicYear: string
  /** Pass line on the 10-point moyenne scale. */
  passMark: number
  officialHeader: boolean
  students: Student[]
  subjects: Subject[]
  /** `${studentId}|${yyyy-mm-dd}` */
  attendance: Record<string, AttendanceStatus>
  /** `${yyyy-mm}|${studentId}|${subjectId}` */
  grades: Record<string, number>
}

export interface Store {
  version: 1
  activeClassId: string
  classes: Classroom[]
}

export interface DayInfo {
  key: string
  year: number
  month: number
  day: number
  weekday: number
  weekend: boolean
  placeholder: boolean
}

export interface MonthlyResult {
  average: number | null
  entered: number
  expected: number
  complete: boolean
  passed: boolean | null
  subjects: Array<{
    subject: Subject
    score: number | null
    normalized: number | null
  }>
}

export interface SemesterMonth {
  year: number
  month: number
  average: number | null
}

export interface SemesterInfo {
  id: 's1' | 's2'
  label: string
  months: Array<{ year: number; month: number }>
  /** True when the open month sits outside the semester, so this is the latest completed one. */
  carried: boolean
}

export interface SemesterResult {
  info: SemesterInfo
  average: number | null
  gpa: number | null
  passed: boolean | null
  months: SemesterMonth[]
}

export interface AttendanceTally {
  present: number
  absent: number
  excused: number
  marked: number
}

export interface RankedStudent {
  student: Student
  rosterIndex: number
  monthly: MonthlyResult
  semester: SemesterResult
  attendance: AttendanceTally
  monthRank: number | null
  semesterRank: number | null
}
