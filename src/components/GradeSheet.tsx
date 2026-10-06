import { useEffect, useMemo, useRef, useState } from 'react'
import { monthKey } from '../lib/calendar'
import { classSummary, gradeKey, rankClassroom } from '../lib/engine'
import { setGrade } from '../lib/edit'
import { formatAverage, formatRank, formatScore, parseScore, toKhmerNumber } from '../lib/khmer'
import type { Classroom, RankedStudent, Subject } from '../lib/types'
import { useMediaQuery, useRowFit } from '../lib/useMedia'
import { EmptyPane } from './AttendanceSheet'

const HEADER = 42

interface Props {
  classroom: Classroom
  year: number
  month: number
  onChange: (next: Classroom) => void
  onOpenSettings: () => void
}

export function GradeSheet({ classroom, year, month, onChange, onOpenSettings }: Props) {
  const narrow = useMediaQuery('(max-width: 899px)')
  const rows = useMemo(() => rankClassroom(classroom, year, month), [classroom, year, month])
  const summary = useMemo(() => classSummary(rows), [rows])
  const [selectedId, setSelectedId] = useState(classroom.students[0]?.id ?? '')
  const [focusSubject, setFocusSubject] = useState<string | null>(null)
  const { ref, fit } = useRowFit(narrow ? 0 : classroom.students.length, HEADER, 16)

  useEffect(() => {
    if (!classroom.students.some((student) => student.id === selectedId)) {
      setSelectedId(classroom.students[0]?.id ?? '')
    }
  }, [classroom.students, selectedId])

  if (classroom.students.length === 0 || classroom.subjects.length === 0) {
    return (
      <EmptyPane
        title="មិនទាន់មានពិន្ទុ"
        body="បញ្ចូលសិស្ស និងមុខវិជ្ជា រួចមធ្យមភាគនឹងគណនាភ្លាម។"
        action={<button type="button" className="btn btn-primary" onClick={onOpenSettings}>កែថ្នាក់</button>}
      />
    )
  }

  const selected = rows.find((row) => row.student.id === selectedId) ?? rows[0]
  const columns = `28px minmax(112px, 168px) repeat(${classroom.subjects.length}, minmax(0, 1fr)) minmax(64px, 84px) 52px`
  const templateRows = fit
    ? `${HEADER}px repeat(${rows.length}, minmax(0, 1fr))`
    : `${HEADER}px repeat(${rows.length}, 32px)`

  return (
    <div className="stage">
      <div className="toolbar">
        <p className="toolbar-stats">
          មធ្យមថ្នាក់ {formatAverage(summary.monthAverage)} · ជាប់ {toKhmerNumber(summary.passed)}/{toKhmerNumber(summary.scored)} · ខ្ពស់ {formatAverage(summary.highest)} · ទាប {formatAverage(summary.lowest)}
        </p>
        <p className="legend-note">មាត្រដ្ឋាន ១០ · ជាប់ពី {toKhmerNumber(classroom.passMark, 1)} ឡើង · ប៉ះសិស្សដើម្បីបញ្ចូលពិន្ទុ</p>
      </div>
      <div className="sheet">
        {narrow ? (
          <div className="phone-list">
            {rows.map((row) => (
              <button
                key={row.student.id}
                type="button"
                className={row.student.id === selected?.student.id ? 'phone-row is-selected' : 'phone-row'}
                onClick={() => setSelectedId(row.student.id)}
              >
                <span>{row.student.name}</span>
                <strong className={row.monthly.passed === false ? 'is-fail' : ''}>{formatAverage(row.monthly.average)}</strong>
                <em className={medalClass(row.monthRank)}>{formatRank(row.monthRank)}</em>
              </button>
            ))}
          </div>
        ) : (
          <div className="matrix-frame" ref={ref}>
            <div
              className={fit ? 'matrix is-fit' : 'matrix is-scroll'}
              role="grid"
              aria-label="តារាងពិន្ទុ"
              data-testid="grade-matrix"
              style={{ gridTemplateColumns: columns, gridTemplateRows: templateRows }}
            >
              <div className="mh">លេខ</div>
              <div className="mh mh-name">សិស្ស</div>
              {classroom.subjects.map((subject) => (
                <div key={subject.id} className="mh subject-head" title={subject.name}>
                  <span>{subject.name}</span>
                  <small>×{toKhmerNumber(subject.coefficient)}</small>
                </div>
              ))}
              <div className="mh">មធ្យម</div>
              <div className="mh" title="ចំណាត់ថ្នាក់">ចំណាត់</div>
              {rows.map((row) => (
                <GradeRow
                  key={row.student.id}
                  row={row}
                  subjects={classroom.subjects}
                  passMark={classroom.passMark}
                  selected={row.student.id === selected?.student.id}
                  onSelect={(studentId, subjectId) => {
                    setSelectedId(studentId)
                    setFocusSubject(subjectId)
                  }}
                />
              ))}
            </div>
          </div>
        )}
        {selected && (
          <ScoreDock
            classroom={classroom}
            row={selected}
            year={year}
            month={month}
            focusSubject={focusSubject}
            onChange={onChange}
            onAdvance={(studentId) => {
              setSelectedId(studentId)
              setFocusSubject(classroom.subjects[0]?.id ?? null)
            }}
          />
        )}
      </div>
    </div>
  )
}

function GradeRow({
  row,
  subjects,
  selected,
  passMark,
  onSelect,
}: {
  row: RankedStudent
  subjects: Subject[]
  selected: boolean
  passMark: number
  onSelect: (studentId: string, subjectId: string | null) => void
}) {
  const rowPass = passMark
  return (
    <>
      <div className="mc mc-index">{toKhmerNumber(row.rosterIndex + 1)}</div>
      <button type="button" className={selected ? 'mc name-btn is-selected' : 'mc name-btn'} onClick={() => onSelect(row.student.id, null)}>
        {row.student.name}
      </button>
      {subjects.map((subject) => {
        const item = row.monthly.subjects.find((entry) => entry.subject.id === subject.id)
        const score = item?.score ?? null
        return (
          <button
            key={subject.id}
            type="button"
            className={`mc score ${tone(score, subject.maxScore, rowPass)}`}
            onClick={() => onSelect(row.student.id, subject.id)}
          >
            {score === null ? '·' : formatScore(score)}
          </button>
        )
      })}
      <div className={row.monthly.passed === false ? 'mc avg is-fail' : 'mc avg'} title={row.monthly.complete ? 'គ្រប់មុខវិជ្ជា' : 'មិនទាន់គ្រប់មុខវិជ្ជា'}>
        {formatAverage(row.monthly.average)}
        {!row.monthly.complete && row.monthly.average !== null ? '*' : ''}
      </div>
      <div className="mc rank-cell">
        <span className={medalClass(row.monthRank)}>{formatRank(row.monthRank)}</span>
      </div>
    </>
  )
}

function ScoreDock({
  classroom,
  row,
  year,
  month,
  focusSubject,
  onChange,
  onAdvance,
}: {
  classroom: Classroom
  row: RankedStudent
  year: number
  month: number
  focusSubject: string | null
  onChange: (next: Classroom) => void
  onAdvance: (id: string) => void
}) {
  const dockRef = useRef<HTMLDivElement>(null)
  const editing = useRef(false)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const gradeStamp = gradeStampFor(classroom, row.student.id, year, month)

  useEffect(() => {
    if (editing.current) return
    const next: Record<string, string> = {}
    const key = monthKey(year, month)
    for (const subject of classroom.subjects) {
      const value = classroom.grades[gradeKey(key, row.student.id, subject.id)]
      next[subject.id] = value === undefined ? '' : String(value)
    }
    setDraft(next)
    setError('')
  }, [classroom.grades, classroom.subjects, gradeStamp, month, row.student.id, year])

  useEffect(() => {
    if (!focusSubject) return
    const input = dockRef.current?.querySelector<HTMLInputElement>(`input[data-subject="${focusSubject}"]`)
    input?.focus()
    input?.select()
  }, [focusSubject, row.student.id])

  function commit(subject: Subject, raw: string, live = false): boolean {
    const trimmed = raw.trim()
    if (live && (trimmed === '-' || trimmed.endsWith('.') || trimmed.endsWith(','))) return false
    const parsed = parseScore(trimmed.endsWith('.') ? trimmed.slice(0, -1) : trimmed)
    if (typeof parsed === 'number' && Number.isNaN(parsed)) {
      if (!live) setError('ពិន្ទុមិនត្រឹមត្រូវ')
      return false
    }
    if (parsed !== null && (parsed < 0 || parsed > subject.maxScore)) {
      setError(`ពិន្ទុត្រូវនៅចន្លោះ ០ និង ${toKhmerNumber(subject.maxScore)}`)
      return false
    }
    setError('')
    const key = gradeKey(monthKey(year, month), row.student.id, subject.id)
    const stored = classroom.grades[key]
    if (parsed === null && stored === undefined) return true
    if (parsed !== null && stored === parsed) return true
    onChange(setGrade(classroom, year, month, row.student.id, subject.id, parsed))
    return true
  }

  function move(index: number) {
    const inputs = dockRef.current?.querySelectorAll<HTMLInputElement>('input')
    const next = inputs?.[index + 1]
    if (next) {
      next.focus()
      next.select()
      return
    }
    const following = classroom.students[row.rosterIndex + 1]
    if (following) onAdvance(following.id)
  }

  return (
    <div className="dock dock-scores" ref={dockRef}>
      <div className="dock-student">
        <strong>{row.student.name}</strong>
        <span className="dock-meta">មធ្យម {formatAverage(row.monthly.average)} · ចំណាត់ថ្នាក់ {formatRank(row.monthRank)}</span>
      </div>
      <div className="score-fields">
        {classroom.subjects.map((subject, index) => (
          <label key={subject.id}>
            <span>{subject.name}</span>
            <input
              data-subject={subject.id}
              inputMode="decimal"
              autoComplete="off"
              aria-label={`${row.student.name} ${subject.name}`}
              value={draft[subject.id] ?? ''}
              placeholder="—"
              onFocus={() => { editing.current = true }}
              onChange={(event) => {
                const raw = event.target.value
                setDraft((current) => ({ ...current, [subject.id]: raw }))
                commit(subject, raw, true)
              }}
              onBlur={(event) => {
                editing.current = false
                commit(subject, event.target.value)
              }}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return
                event.preventDefault()
                if (commit(subject, event.currentTarget.value)) move(index)
              }}
            />
            <small>/{toKhmerNumber(subject.maxScore)}</small>
          </label>
        ))}
      </div>
      {error && <p className="dock-error">{error}</p>}
    </div>
  )
}

function gradeStampFor(classroom: Classroom, studentId: string, year: number, month: number): string {
  const prefix = `${monthKey(year, month)}|${studentId}|`
  return Object.keys(classroom.grades)
    .filter((key) => key.startsWith(prefix))
    .map((key) => `${key}:${classroom.grades[key]}`)
    .join('|')
}

function tone(score: number | null, max: number, passMark: number): string {
  if (score === null || max <= 0) return 'tone-empty'
  const normalized = (score / max) * 10
  if (normalized < passMark) return 'tone-bad'
  if (normalized >= 8) return 'tone-good'
  return 'tone-mid'
}

function medalClass(rank: number | null): string {
  if (rank === 1) return 'medal medal-1'
  if (rank === 2) return 'medal medal-2'
  if (rank === 3) return 'medal medal-3'
  return 'medal'
}
