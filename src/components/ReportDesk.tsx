import { useMemo, useState } from 'react'
import { monthKey } from '../lib/calendar'
import { downloadText } from '../lib/download'
import { mention, rankClassroom, semesterRangeLabel } from '../lib/engine'
import { KHMER_MONTHS, WEEKDAY_LONG, formatAverage, formatRank, formatScore, genderLabel, toKhmerNumber } from '../lib/khmer'
import { buildAllNotices, buildProgressNotice, telegramShareHref } from '../lib/report'
import type { Classroom, RankedStudent } from '../lib/types'
import { useMediaQuery } from '../lib/useMedia'
import { EmptyPane } from './AttendanceSheet'
import { IconSend } from './icons'

interface Props {
  classroom: Classroom
  year: number
  month: number
  studentId: string | null
  onSelect: (studentId: string) => void
  onToast: (message: string) => void
}

export function ReportDesk({ classroom, year, month, studentId, onSelect, onToast }: Props) {
  const narrow = useMediaQuery('(max-width: 899px)')
  const [query, setQuery] = useState('')
  const rows = useMemo(() => rankClassroom(classroom, year, month), [classroom, year, month])
  const visible = rows.filter((row) => row.student.name.includes(query.trim()))
  const selected = rows.find((row) => row.student.id === studentId) ?? visible[0] ?? rows[0]

  if (!selected) {
    return <EmptyPane title="មិនទាន់មានលិខិត" body="បន្ថែមសិស្សសិន ទើបចេញលិខិតជូនដំណឹងទៅមាតាបិតាបាន។" />
  }

  const text = buildProgressNotice(classroom, selected.student.id, year, month)
  const href = telegramShareHref(text)

  function share() {
    void navigator.clipboard?.writeText(text).catch(() => undefined)
    onToast('ចម្លងលិខិតរួច ហើយបើក Telegram')
  }

  return (
    <div className="stage report-stage">
      <div className={narrow ? 'report-layout is-narrow' : 'report-layout'}>
        <aside className="roster-col">
          <label className="search">
            <span className="sr-only">ស្វែងរកសិស្ស</span>
            <input value={query} placeholder="ស្វែងរកសិស្ស" onChange={(event) => setQuery(event.target.value)} />
          </label>
          <ul>
            {visible.map((row) => (
              <li key={row.student.id}>
                <button
                  type="button"
                  className={row.student.id === selected.student.id ? 'is-selected' : ''}
                  onClick={() => onSelect(row.student.id)}
                >
                  <span className={medal(row.monthRank)}>{formatRank(row.monthRank)}</span>
                  <span>{row.student.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <div className="report-preview">
          <div className="report-actions no-print">
            <a className="btn btn-primary" data-testid="telegram-share" href={href} target="_blank" rel="noopener noreferrer" onClick={share}>
              <IconSend /> ផ្ញើ Telegram
            </a>
            <button type="button" className="btn btn-ghost" onClick={() => { void navigator.clipboard?.writeText(text).then(() => onToast('ចម្លងអត្ថបទរួច')).catch(() => onToast('មិនអាចចម្លងបានទេ')) }}>
              ចម្លង
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => window.print()}>បោះពុម្ព</button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => downloadText(fileName(classroom, year, month, selected.student.name), text, { bom: true })}
            >
              ទាញយក
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                downloadText(fileName(classroom, year, month, 'ទាំងអស់'), buildAllNotices(classroom, year, month), { bom: true })
                onToast('បានទាញយកលិខិតគ្រប់សិស្ស')
              }}
            >
              ទាញយកគ្រប់សិស្ស
            </button>
          </div>
          <Notice
            classroom={classroom}
            row={selected}
            year={year}
            month={month}
            monthCount={rows.filter((item) => item.monthRank !== null).length}
            semesterCount={rows.filter((item) => item.semesterRank !== null).length}
          />
          <section className="tg-block no-print">
            <h2>អត្ថបទផ្ញើ Telegram</h2>
            <pre data-testid="telegram-text">{text}</pre>
          </section>
        </div>
      </div>
    </div>
  )
}

function Notice({
  classroom,
  row,
  year,
  month,
  monthCount,
  semesterCount,
}: {
  classroom: Classroom
  row: RankedStudent
  year: number
  month: number
  monthCount: number
  semesterCount: number
}) {
  const now = new Date()
  const dated = `ថ្ងៃ${WEEKDAY_LONG[now.getDay()]} ទី${toKhmerNumber(now.getDate())} ខែ${KHMER_MONTHS[now.getMonth() + 1]} ឆ្នាំ${toKhmerNumber(now.getFullYear())}`
  return (
    <article className="report-sheet" data-testid="progress-notice">
      <header>
        {classroom.officialHeader && (
          <>
            <p className="kingdom">ព្រះរាជាណាចក្រកម្ពុជា</p>
            <p className="motto">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
          </>
        )}
        <h2>{classroom.schoolName}</h2>
        <h1>លិខិតជូនដំណឹងលទ្ធផលសិក្សា</h1>
        <p className="dated">{dated}</p>
      </header>
      <dl className="meta">
        <div><dt>សិស្ស</dt><dd>{row.student.name}</dd></div>
        <div><dt>ភេទ</dt><dd>{genderLabel(row.student.gender)}</dd></div>
        <div><dt>លេខរៀង</dt><dd>{toKhmerNumber(row.rosterIndex + 1)}</dd></div>
        <div><dt>ថ្នាក់</dt><dd>{classroom.className}</dd></div>
        <div><dt>ឆ្នាំសិក្សា</dt><dd>{classroom.academicYear}</dd></div>
        <div><dt>ខែ</dt><dd>{KHMER_MONTHS[month]} {toKhmerNumber(year)}</dd></div>
      </dl>
      <table>
        <thead>
          <tr>
            <th>មុខវិជ្ជា</th>
            <th>មេគុណ</th>
            <th>ពិន្ទុ</th>
          </tr>
        </thead>
        <tbody>
          {row.monthly.subjects.map((item) => (
            <tr key={item.subject.id}>
              <td>{item.subject.name}</td>
              <td>{toKhmerNumber(item.subject.coefficient)}</td>
              <td>{item.score === null ? 'មិនទាន់មាន' : `${formatScore(item.score)}/${formatScore(item.subject.maxScore)}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="result-row">
        <div>
          <p>មធ្យមភាគប្រចាំខែ <strong>{formatAverage(row.monthly.average)}</strong> /១០</p>
          <p>ចំណាត់ថ្នាក់លេខ <strong>{formatRank(row.monthRank)}</strong> ក្នុងចំណោម {toKhmerNumber(monthCount)}</p>
          <p>និទ្ទេស <strong>{row.monthly.average === null ? '—' : mention(row.monthly.average)}</strong></p>
          {!row.monthly.complete && row.monthly.average !== null && <p className="note">ពិន្ទុមិនទាន់គ្រប់មុខវិជ្ជា</p>}
        </div>
        {row.monthly.average !== null && (
          <div className={row.monthly.passed ? 'mention-seal' : 'mention-seal is-fail'}>
            <span>{mention(row.monthly.average)}</span>
            <strong>{formatAverage(row.monthly.average)}</strong>
          </div>
        )}
      </div>
      <section className="semester-block">
        <h3>
          {row.semester.info.label} · {semesterRangeLabel(row.semester.info)}
          {row.semester.info.carried ? ' · ឆមាសចុងក្រោយ' : ''}
        </h3>
        <p>មធ្យមភាគឆមាស <strong>{formatAverage(row.semester.average)}</strong> /១០ · GPA <strong>{formatAverage(row.semester.gpa)}</strong> /៤.០០</p>
        <p>ចំណាត់ថ្នាក់ឆមាសលេខ <strong>{formatRank(row.semesterRank)}</strong> ក្នុងចំណោម {toKhmerNumber(semesterCount)}</p>
        <ul>
          {row.semester.months.map((item) => (
            <li key={monthKey(item.year, item.month)}>
              {KHMER_MONTHS[item.month]} {item.average === null ? '—' : formatAverage(item.average)}
            </li>
          ))}
        </ul>
      </section>
      <section className="attendance-block">
        <h3>វត្តមានខែ{KHMER_MONTHS[month]}</h3>
        <p>
          <span className="count-present">វត្តមាន {toKhmerNumber(row.attendance.present)} ថ្ងៃ</span>
          <span className="count-absent">អវត្តមាន {toKhmerNumber(row.attendance.absent)} ថ្ងៃ</span>
          <span className="count-excused">ច្បាប់ {toKhmerNumber(row.attendance.excused)} ថ្ងៃ</span>
        </p>
      </section>
      <p className="closing">សូមជូនមាតាបិតា និងអាណាព្យាបាលដើម្បីជ្រាបជាការណ៍។</p>
      <div className="signatures">
        <div>
          <span>គ្រូបន្ទុកថ្នាក់</span>
          <strong>{classroom.teacherName}</strong>
        </div>
        <div>
          <span>អាណាព្យាបាល</span>
          <strong> </strong>
        </div>
      </div>
    </article>
  )
}

function medal(rank: number | null): string {
  if (rank === 1) return 'medal medal-1'
  if (rank === 2) return 'medal medal-2'
  if (rank === 3) return 'medal medal-3'
  return 'medal'
}

function fileName(classroom: Classroom, year: number, month: number, who: string): string {
  return `លិខិត-${classroom.className}-${KHMER_MONTHS[month]}-${year}-${who}.txt`.replace(/\s+/g, '-')
}
