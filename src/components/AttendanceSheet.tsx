import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { monthDays, monthWeeks, weekContaining } from '../lib/calendar'
import { classAttendance, attendanceKey, tallyAttendance } from '../lib/engine'
import { clearMonthAttendance, cycleAttendance, fillSchoolDays, setDateStatus } from '../lib/edit'
import { STATUS_GLYPH, STATUS_LABEL, WEEKDAY_LONG, WEEKDAY_SHORT, toKhmerNumber } from '../lib/khmer'
import type { AttendanceStatus, Classroom, DayInfo } from '../lib/types'
import { useMediaQuery, useRowFit } from '../lib/useMedia'

const HEADER = 30

interface Props {
  classroom: Classroom
  year: number
  month: number
  onChange: (next: Classroom) => void
  onOpenReport: (studentId: string) => void
  onOpenSettings: () => void
}

export function AttendanceSheet({ classroom, year, month, onChange, onOpenReport, onOpenSettings }: Props) {
  const narrow = useMediaQuery('(max-width: 899px)')
  const weeks = useMemo(() => monthWeeks(year, month), [year, month])
  const [week, setWeek] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pending, setPending] = useState<'fill' | 'clear' | null>(null)
  const [menu, setMenu] = useState<{ key: string; label: string; x: number; y: number } | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const classRef = useRef(classroom)
  classRef.current = classroom

  useEffect(() => {
    const now = new Date()
    if (now.getFullYear() === year && now.getMonth() + 1 === month) {
      setWeek(weekContaining(year, month, now.getDate()))
    } else {
      setWeek(0)
    }
    setPending(null)
    setMenu(null)
  }, [year, month])

  const allDays = useMemo(() => monthDays(year, month), [year, month])
  const days = narrow ? (weeks[week] ?? []) : allDays
  const cycle = useCallback((studentId: string, date: string) => {
    setSelectedId(studentId)
    onChangeRef.current(cycleAttendance(classRef.current, studentId, date))
  }, [])
  const { ref, fit } = useRowFit(classroom.students.length, HEADER, 13)
  const totals = useMemo(() => classAttendance(classroom, year, month), [classroom, year, month])
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const todayInView = days.some((day) => day.key === todayKey)

  if (classroom.students.length === 0) {
    return (
      <EmptyPane
        title="មិនទាន់មានសិស្ស"
        body="បន្ថែមបញ្ជីឈ្មោះ រួចសៀវភៅវត្តមាននឹងរៀបជាតារាងពេញថ្នាក់។"
        action={<button type="button" className="btn btn-primary" onClick={onOpenSettings}>បន្ថែមសិស្ស</button>}
      />
    )
  }

  const columns = narrow
    ? '28px minmax(128px, 1.5fr) repeat(7, minmax(0, 1fr)) minmax(72px, 92px)'
    : `28px minmax(112px, 168px) repeat(${days.length}, minmax(0, 1fr)) minmax(62px, 84px)`
  const templateRows = fit
    ? `${HEADER}px repeat(${classroom.students.length}, minmax(0, 1fr))`
    : `${HEADER}px repeat(${classroom.students.length}, 30px)`

  function applyPending() {
    if (pending === 'fill') onChange(fillSchoolDays(classroom, year, month, 'present'))
    if (pending === 'clear') onChange(clearMonthAttendance(classroom, year, month))
    setPending(null)
  }

  const selected = classroom.students.find((student) => student.id === selectedId) ?? null
  const selectedTally = selected ? tallyAttendance(classroom, selected.id, year, month) : null
  const selectedIndex = selected ? classroom.students.findIndex((student) => student.id === selected.id) : -1

  return (
    <div className="stage">
      <div className="toolbar">
        <div className="legend" aria-hidden="true">
          <span><i className="swatch swatch-present" />វត្តមាន</span>
          <span><i className="swatch swatch-absent" />អវត្តមាន</span>
          <span><i className="swatch swatch-excused" />ច្បាប់</span>
          <span className="legend-note">ប៉ះប្តូរ វ → អ → ច</span>
        </div>
        <p className="toolbar-stats">
          ខែនេះ វ {toKhmerNumber(totals.present)} · អ {toKhmerNumber(totals.absent)} · ច {toKhmerNumber(totals.excused)}
        </p>
        <div className="toolbar-actions">
          {narrow && (
            <div className="week-switch">
              <button type="button" className="btn btn-ghost" disabled={week === 0} onClick={() => setWeek((value) => value - 1)}>មុន</button>
              <span>សប្តាហ៍ទី{toKhmerNumber(week + 1)}</span>
              <button type="button" className="btn btn-ghost" disabled={week >= weeks.length - 1} onClick={() => setWeek((value) => value + 1)}>បន្ទាប់</button>
            </div>
          )}
          <button type="button" className="btn btn-ghost" disabled={!todayInView} onClick={() => onChange(setDateStatus(classroom, todayKey, 'present'))}>
            វត្តមានថ្ងៃនេះ
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setPending('fill')}>បំពេញថ្ងៃរៀន</button>
          <button type="button" className="btn btn-ghost" onClick={() => setPending('clear')}>សម្អាតខែ</button>
        </div>
      </div>
      {pending && (
        <div className="confirm-bar">
          <p>{pending === 'fill' ? 'កត់ថ្ងៃចន្ទដល់សុក្រទាំងអស់ជាវត្តមានមែនទេ?' : 'លុបកំណត់ត្រាវត្តមានពេញខែនេះមែនទេ?'}</p>
          <button type="button" className="btn btn-primary" onClick={applyPending}>យល់ព្រម</button>
          <button type="button" className="btn btn-ghost" onClick={() => setPending(null)}>បោះបង់</button>
        </div>
      )}
      <div className="sheet">
        <div className="matrix-frame" ref={ref}>
          <div
            className={fit ? 'matrix is-fit' : 'matrix is-scroll'}
            role="grid"
            aria-label="តារាងវត្តមាន"
            data-testid="attendance-matrix"
            data-fit={fit ? 'true' : 'false'}
            data-students={classroom.students.length}
            style={{ gridTemplateColumns: columns, gridTemplateRows: templateRows }}
            onKeyDown={onArrow}
          >
            <div className="mh" role="columnheader">លេខ</div>
            <div className="mh mh-name" role="columnheader">សិស្ស</div>
            {days.map((day) =>
              day.placeholder ? (
                <div key={day.key} className="mh is-blank" />
              ) : (
                <button
                  key={day.key}
                  type="button"
                  className={headClass(day, todayKey)}
                  onClick={(event) =>
                    setMenu({
                      key: day.key,
                      label: `ថ្ងៃ${WEEKDAY_LONG[day.weekday]} ទី${toKhmerNumber(day.day)}`,
                      x: event.clientX,
                      y: event.clientY,
                    })
                  }
                >
                  <span className="wd">{WEEKDAY_SHORT[day.weekday]}</span>
                  <span className="dn">{toKhmerNumber(day.day)}</span>
                </button>
              ),
            )}
            <div className="mh" role="columnheader" title="វត្តមាន · អវត្តមាន · ច្បាប់">វ·អ·ច</div>
            {classroom.students.map((student, index) => (
              <AttendanceRow
                key={student.id}
                studentId={student.id}
                name={student.name}
                index={index}
                days={days}
                selected={student.id === selectedId}
                signature={days.map((day) => statusToken(classroom.attendance[attendanceKey(student.id, day.key)])).join('')}
                todayKey={todayKey}
                onSelect={setSelectedId}
                onCycle={cycle}
              />
            ))}
          </div>
        </div>
        {selected && selectedTally && (
          <div className="dock">
            <div>
              <strong>{selected.name}</strong>
              <span className="dock-meta">លេខរៀង {toKhmerNumber(selectedIndex + 1)}</span>
            </div>
            <p className="dock-counts">
              <span className="count-present">វត្តមាន {toKhmerNumber(selectedTally.present)}</span>
              <span className="count-absent">អវត្តមាន {toKhmerNumber(selectedTally.absent)}</span>
              <span className="count-excused">ច្បាប់ {toKhmerNumber(selectedTally.excused)}</span>
            </p>
            <button type="button" className="btn btn-primary" onClick={() => onOpenReport(selected.id)}>លិខិតជូនដំណឹង</button>
          </div>
        )}
      </div>
      {menu && (
        <>
          <button type="button" className="popover-backdrop" aria-label="បិទ" onClick={() => setMenu(null)} />
          <div className="popover" style={{ left: Math.min(menu.x, window.innerWidth - 220), top: Math.min(menu.y + 8, window.innerHeight - 140) }}>
            <p>{menu.label}</p>
            <button type="button" onClick={() => { onChange(setDateStatus(classroom, menu.key, 'present')); setMenu(null) }}>វត្តមានទាំងអស់</button>
            <button type="button" onClick={() => { onChange(setDateStatus(classroom, menu.key, null)); setMenu(null) }}>សម្អាតថ្ងៃនេះ</button>
          </div>
        </>
      )}
    </div>
  )
}

function headClass(day: DayInfo, todayKey: string): string {
  const names = ['mh', 'day-head']
  if (day.weekend) names.push('is-weekend')
  if (day.key === todayKey) names.push('is-today')
  return names.join(' ')
}

function onArrow(event: React.KeyboardEvent<HTMLDivElement>) {
  const target = event.target as HTMLElement
  if (!target.dataset.row || target.dataset.col === undefined) return
  const move: Record<string, [number, number]> = {
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1],
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
  }
  const delta = move[event.key]
  if (!delta) return
  event.preventDefault()
  const next = event.currentTarget.querySelector<HTMLElement>(
    `[data-row="${Number(target.dataset.row) + delta[0]}"][data-col="${Number(target.dataset.col) + delta[1]}"]`,
  )
  next?.focus()
}

const AttendanceRow = memo(function AttendanceRow({
  studentId,
  name,
  index,
  days,
  selected,
  signature,
  todayKey,
  onSelect,
  onCycle,
}: {
  studentId: string
  name: string
  index: number
  days: DayInfo[]
  selected: boolean
  signature: string
  todayKey: string
  onSelect: (id: string) => void
  onCycle: (studentId: string, date: string) => void
}) {
  const counts = countMarks(signature)
  return (
    <>
      <div className="mc mc-index" role="rowheader">{toKhmerNumber(index + 1)}</div>
      <button type="button" className={selected ? 'mc name-btn is-selected' : 'mc name-btn'} title={name} onClick={() => onSelect(studentId)}>
        {name}
      </button>
      {days.map((day, column) => {
        if (day.placeholder) return <div key={day.key} className="mc is-blank" />
        const status = markAt(signature, column)
        const names = ['mc', 'att', `att-${status ?? 'empty'}`]
        if (day.weekend) names.push('is-weekend')
        if (day.key === todayKey) names.push('is-today')
        return (
          <button
            key={day.key}
            type="button"
            className={names.join(' ')}
            data-row={index}
            data-col={column}
            data-status={status ?? 'empty'}
            aria-label={`${name} ថ្ងៃទី${toKhmerNumber(day.day)} ${status ? STATUS_LABEL[status] : 'មិនទាន់កត់'}`}
            onClick={() => onCycle(studentId, day.key)}
          >
            {status ? STATUS_GLYPH[status] : ''}
          </button>
        )
      })}
      <div className="mc sum" title={`វត្តមាន ${counts.present} · អវត្តមាន ${counts.absent} · ច្បាប់ ${counts.excused}`}>
        <span className="count-present">{toKhmerNumber(counts.present)}</span>
        <span className="count-absent">{toKhmerNumber(counts.absent)}</span>
        <span className="count-excused">{toKhmerNumber(counts.excused)}</span>
      </div>
    </>
  )
})

function statusToken(status: AttendanceStatus | undefined): string {
  if (status === 'present') return 'p'
  if (status === 'absent') return 'a'
  if (status === 'excused') return 'e'
  return '_'
}

function markAt(signature: string, column: number): AttendanceStatus | null {
  const token = signature.split('')[column]
  if (token === 'p') return 'present'
  if (token === 'a') return 'absent'
  if (token === 'e') return 'excused'
  return null
}

function countMarks(signature: string) {
  let present = 0
  let absent = 0
  let excused = 0
  for (const token of signature) {
    if (token === 'p') present += 1
    if (token === 'a') absent += 1
    if (token === 'e') excused += 1
  }
  return { present, absent, excused }
}

export function EmptyPane({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      <p>{body}</p>
      {action}
    </div>
  )
}
