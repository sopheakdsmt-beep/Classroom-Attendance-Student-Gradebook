import { monthDays, monthKey } from './calendar'
import { attendanceKey, gradeKey, nextStatus } from './engine'
import type { AttendanceStatus, Classroom } from './types'

export function cycleAttendance(classroom: Classroom, studentId: string, date: string): Classroom {
  const key = attendanceKey(studentId, date)
  const next = nextStatus(classroom.attendance[key] ?? null)
  const attendance = { ...classroom.attendance }
  if (next === null) delete attendance[key]
  else attendance[key] = next
  return { ...classroom, attendance }
}

export function setDateStatus(
  classroom: Classroom,
  date: string,
  status: AttendanceStatus | null,
): Classroom {
  const attendance = { ...classroom.attendance }
  for (const student of classroom.students) {
    const key = attendanceKey(student.id, date)
    if (status === null) delete attendance[key]
    else attendance[key] = status
  }
  return { ...classroom, attendance }
}

/** Marks every Monday–Friday in the month. Weekend cells stay as they are. */
export function fillSchoolDays(
  classroom: Classroom,
  year: number,
  month: number,
  status: AttendanceStatus,
): Classroom {
  const attendance = { ...classroom.attendance }
  for (const day of monthDays(year, month)) {
    if (day.weekend) continue
    for (const student of classroom.students) {
      attendance[attendanceKey(student.id, day.key)] = status
    }
  }
  return { ...classroom, attendance }
}

export function clearMonthAttendance(classroom: Classroom, year: number, month: number): Classroom {
  const prefix = monthKey(year, month)
  const attendance = { ...classroom.attendance }
  for (const key of Object.keys(attendance)) {
    const date = key.split('|')[1] ?? ''
    if (date.startsWith(prefix)) delete attendance[key]
  }
  return { ...classroom, attendance }
}

export function setGrade(
  classroom: Classroom,
  year: number,
  month: number,
  studentId: string,
  subjectId: string,
  score: number | null,
): Classroom {
  const key = gradeKey(monthKey(year, month), studentId, subjectId)
  const grades = { ...classroom.grades }
  if (score === null) delete grades[key]
  else grades[key] = score
  return { ...classroom, grades }
}
