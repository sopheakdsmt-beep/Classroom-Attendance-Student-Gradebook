import { useMemo, useState, type ReactNode } from 'react'
import { FORMULA_TEXT, classSummary, mention, rankClassroom, semesterRangeLabel } from '../lib/engine'
import { buildProgressNotice, telegramShareHref } from '../lib/report'
import { formatAverage, formatRank, toKhmerNumber } from '../lib/khmer'
import type { Classroom, RankedStudent } from '../lib/types'
import { useMediaQuery, useRowFit } from '../lib/useMedia'
import { EmptyPane } from './AttendanceSheet'
import { IconSend } from './icons'

const HEADER = 36

type SortKey = 'month' | 'semester' | 'name' | 'absent'

interface Props {
  classroom: Classroom
  year: number
  month: number
  onOpenReport: (studentId: string) => void
  onToast: (message: string) => void
}

export function RankBoard({ classroom, year, month, onOpenReport, onToast }: Props) {
  const narrow = useMediaQuery('(max-width: 899px)')
  const [sortKey, setSortKey] = useState<SortKey>('month')
  const source = useMemo(() => rankClassroom(classroom, year, month), [classroom, year, month])
  const summary = useMemo(() => classSummary(source), [source])
  const rows = useMemo(() => sortRows(source, sortKey), [source, sortKey])
  const tied = useMemo(() => tiedSet(source, sortKey === 'semester' ? 'semesterRank' : 'monthRank'), [source, sortKey])
  const { ref, fit } = useRowFit(narrow ? 0 : rows.length, HEADER, 16)
  const semester = source[0]?.semester.info

  if (classroom.students.length === 0) {
    return <EmptyPane title="មិនទាន់មានចំណាត់ថ្នាក់" body="បន្ថែមសិស្ស និងពិន្ទុ រួចលេខ១ ២ ៣ នឹងចេញមកឯង។" />
  }

  const columns = '52px minmax(120px, 1.7fr) minmax(72px, 1fr) minmax(78px, 1fr) minmax(58px, 0.7fr) minmax(78px, 0.9fr) minmax(92px, 1fr) 40px'
  const templateRows = fit
    ? `${HEADER}px repeat(${rows.length}, minmax(0, 1fr))`
    : `${HEADER}px repeat(${rows.length}, 34px)`

  return (
    <div className="stage">
      <div className="toolbar">
        <p className="toolbar-stats">
          {semester ? `${semester.label} ${semesterRangeLabel(semester)}${semester.carried ? ' · ឆមាសចុងក្រោយ' : ''}` : ''}
          {' · '}មធ្យមខែ {formatAverage(summary.monthAverage)} · មធ្យមឆមាស {formatAverage(summary.semesterAverage)}
        </p>
        <details className="formula">
          <summary>របៀបគណនា</summary>
          <p>{FORMULA_TEXT}</p>
          <p>និទ្ទេស៖ ≥៩ ល្អប្រសើរ · ≥៨ ល្អណាស់ · ≥៧ ល្អ · ≥៦ ល្អបង្គួរ · ≥៥ មធ្យម · ក្រោម៥ ខ្សោយ។</p>
        </details>
      </div>
      {narrow ? (
        <div className="phone-list">
          {rows.map((row) => (
            <article key={row.student.id} className="rank-card">
              <button type="button" className="rank-card-main" onClick={() => onOpenReport(row.student.id)}>
                <span className={medalClass(row.monthRank)}>{formatRank(row.monthRank)}</span>
                <span>
                  <strong>{row.student.name}</strong>
                  <small>{row.monthly.average === null ? 'មិនទាន់មានពិន្ទុ' : mention(row.monthly.average)} · ឆមាស {formatAverage(row.semester.average)} · GPA {formatAverage(row.semester.gpa)}</small>
                </span>
              </button>
              <ShareLink classroom={classroom} studentId={row.student.id} year={year} month={month} onToast={onToast} />
            </article>
          ))}
        </div>
      ) : (
        <div className="sheet">
          <div className="matrix-frame" ref={ref}>
            <div
              className={fit ? 'matrix is-fit' : 'matrix is-scroll'}
              role="grid"
              aria-label="ចំណាត់ថ្នាក់ថ្នាក់រៀន"
              data-testid="rank-board"
              style={{ gridTemplateColumns: columns, gridTemplateRows: templateRows }}
            >
              <SortHead label="លេខ" active={sortKey === 'month'} onClick={() => setSortKey('month')} />
              <SortHead label="សិស្ស" active={sortKey === 'name'} onClick={() => setSortKey('name')} />
              <div className="mh">មធ្យមខែ</div>
              <SortHead label="មធ្យមឆមាស" active={sortKey === 'semester'} onClick={() => setSortKey('semester')} />
              <div className="mh">GPA</div>
              <div className="mh">និទ្ទេស</div>
              <SortHead label="វ·អ·ច" active={sortKey === 'absent'} onClick={() => setSortKey('absent')} />
              <div className="mh">ផ្ញើ</div>
              {rows.map((row) => (
                <RankRow
                  key={row.student.id}
                  row={row}
                  rank={sortKey === 'semester' ? row.semesterRank : row.monthRank}
                  tied={tied.has((sortKey === 'semester' ? row.semesterRank : row.monthRank) ?? -1)}
                  onOpen={() => onOpenReport(row.student.id)}
                  share={<ShareLink classroom={classroom} studentId={row.student.id} year={year} month={month} onToast={onToast} />}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SortHead({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" className={active ? 'mh sort-head is-active' : 'mh sort-head'} onClick={onClick}>
      {label}
    </button>
  )
}

function RankRow({
  row,
  rank,
  tied,
  onOpen,
  share,
}: {
  row: RankedStudent
  rank: number | null
  tied: boolean
  onOpen: () => void
  share: ReactNode
}) {
  return (
    <>
      <button type="button" className="mc rank-open" onClick={onOpen}>
        <span className={medalClass(rank)} title={tied ? 'ពិន្ទុស្មើគ្នា' : undefined}>{formatRank(rank)}</span>
      </button>
      <button type="button" className="mc name-btn" onClick={onOpen}>{row.student.name}</button>
      <button type="button" className={row.monthly.passed === false ? 'mc is-fail' : 'mc'} onClick={onOpen}>
        {formatAverage(row.monthly.average)}{!row.monthly.complete && row.monthly.average !== null ? '*' : ''}
      </button>
      <button type="button" className="mc" onClick={onOpen}>{formatAverage(row.semester.average)}</button>
      <button type="button" className="mc" onClick={onOpen}>{formatAverage(row.semester.gpa)}</button>
      <button type="button" className="mc mention-cell" onClick={onOpen}>{row.monthly.average === null ? '—' : mention(row.monthly.average)}</button>
      <button type="button" className="mc sum" onClick={onOpen}>
        <span className="count-present">{toKhmerNumber(row.attendance.present)}</span>
        <span className="count-absent">{toKhmerNumber(row.attendance.absent)}</span>
        <span className="count-excused">{toKhmerNumber(row.attendance.excused)}</span>
      </button>
      <div className="mc share-cell">{share}</div>
    </>
  )
}

function ShareLink({
  classroom,
  studentId,
  year,
  month,
  onToast,
}: {
  classroom: Classroom
  studentId: string
  year: number
  month: number
  onToast: (message: string) => void
}) {
  return (
    <a
      className="icon-link"
      href="#ផ្ញើ"
      aria-label="ផ្ញើ Telegram"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        const text = buildProgressNotice(classroom, studentId, year, month)
        void navigator.clipboard?.writeText(text).catch(() => undefined)
        onToast('ចម្លងលិខិតរួច ហើយបើក Telegram')
        window.open(telegramShareHref(text), '_blank', 'noopener,noreferrer')
      }}
    >
      <IconSend />
    </a>
  )
}

function sortRows(rows: RankedStudent[], sortKey: SortKey): RankedStudent[] {
  const next = rows.slice()
  next.sort((a, b) => {
    if (sortKey === 'name') return a.student.name.localeCompare(b.student.name, 'km')
    if (sortKey === 'absent') return b.attendance.absent - a.attendance.absent || a.student.name.localeCompare(b.student.name, 'km')
    if (sortKey === 'semester') return compareRank(a.semesterRank, b.semesterRank) || a.student.name.localeCompare(b.student.name, 'km')
    return compareRank(a.monthRank, b.monthRank) || a.student.name.localeCompare(b.student.name, 'km')
  })
  return next
}

function compareRank(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return a - b
}

function medalClass(rank: number | null): string {
  if (rank === 1) return 'medal medal-1'
  if (rank === 2) return 'medal medal-2'
  if (rank === 3) return 'medal medal-3'
  return 'medal'
}

function tiedSet(rows: RankedStudent[], key: 'monthRank' | 'semesterRank'): Set<number> {
  const counts = new Map<number, number>()
  for (const row of rows) {
    const rank = row[key]
    if (rank === null) continue
    counts.set(rank, (counts.get(rank) ?? 0) + 1)
  }
  return new Set([...counts].filter(([, count]) => count > 1).map(([rank]) => rank))
}
