import { useEffect, useState } from 'react'
import { AttendanceSheet } from './components/AttendanceSheet'
import { GradeSheet } from './components/GradeSheet'
import { IconChevron, IconGear } from './components/icons'
import { RankBoard } from './components/RankBoard'
import { ReportDesk } from './components/ReportDesk'
import { SettingsDialog } from './components/SettingsDialog'
import { shiftMonth } from './lib/calendar'
import { KHMER_MONTHS, toKhmerNumber } from './lib/khmer'
import { loadStore, saveStore } from './lib/storage'
import type { Classroom, Store } from './lib/types'
import { useMediaQuery } from './lib/useMedia'

type View = 'attendance' | 'grades' | 'ranks' | 'reports'

const VIEWS: Array<{ id: View; label: string; hint: string }> = [
  { id: 'attendance', label: 'វត្តមាន', hint: 'Attendance' },
  { id: 'grades', label: 'ពិន្ទុ', hint: 'Grades' },
  { id: 'ranks', label: 'ចំណាត់ថ្នាក់', hint: 'Rank' },
  { id: 'reports', label: 'លិខិត', hint: 'Report' },
]

export function App() {
  const narrow = useMediaQuery('(max-width: 899px)')
  const [store, setStore] = useState<Store>(() => loadStore())
  const [view, setView] = useState<View>('attendance')
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [reportStudentId, setReportStudentId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    saveStore(store)
  }, [store])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const next = { '1': 'attendance', '2': 'grades', '3': 'ranks', '4': 'reports' }[event.key] as View | undefined
      if (next) setView(next)
      if (event.key === 'Escape') setSettingsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const classroom = store.classes.find((item) => item.id === store.activeClassId) ?? store.classes[0]
  const now = new Date()
  const viewingToday = cursor.year === now.getFullYear() && cursor.month === now.getMonth() + 1

  function updateActive(next: Classroom) {
    setStore((current) => ({
      ...current,
      classes: current.classes.map((item) => (item.id === next.id ? next : item)),
    }))
  }

  function openReport(studentId: string) {
    setReportStudentId(studentId)
    setView('reports')
  }

  const nav = (
    <div className="nav" role="tablist" aria-label="ផ្នែក">
      {VIEWS.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={view === item.id}
          className={view === item.id ? 'nav-btn is-active' : 'nav-btn'}
          onClick={() => setView(item.id)}
        >
          <span>{item.label}</span>
          <small>{item.hint}</small>
        </button>
      ))}
    </div>
  )

  return (
    <div className="app" data-view={view}>
      <header className="topbar">
        <div className="brand">
          <div className="seal-mark" aria-hidden="true">វ</div>
          <div className="brand-text">
            <strong>សៀវភៅបញ្ជី</strong>
            <p title={`${classroom.schoolName} · ${classroom.className}`}>{classroom.schoolName} · {classroom.className}</p>
          </div>
        </div>
        {!narrow && nav}
        <div className="month-switch">
          <button type="button" className="icon-btn" aria-label="ខែមុន" onClick={() => setCursor((current) => shiftMonth(current.year, current.month, -1))}>
            <IconChevron direction="left" />
          </button>
          <div>
            <strong>{KHMER_MONTHS[cursor.month]}</strong>
            <span>{toKhmerNumber(cursor.year)}</span>
          </div>
          <button type="button" className="icon-btn" aria-label="ខែបន្ទាប់" onClick={() => setCursor((current) => shiftMonth(current.year, current.month, 1))}>
            <IconChevron direction="right" />
          </button>
          {!viewingToday && (
            <button
              type="button"
              className="btn btn-ghost btn-today"
              onClick={() => setCursor({ year: now.getFullYear(), month: now.getMonth() + 1 })}
            >
              ខែនេះ
            </button>
          )}
        </div>
        <button type="button" className="icon-btn" aria-label="កំណត់ថ្នាក់" onClick={() => setSettingsOpen(true)}>
          <IconGear />
        </button>
      </header>
      <main className="workspace">
        {view === 'attendance' && (
          <AttendanceSheet
            classroom={classroom}
            year={cursor.year}
            month={cursor.month}
            onChange={updateActive}
            onOpenReport={openReport}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        )}
        {view === 'grades' && (
          <GradeSheet
            classroom={classroom}
            year={cursor.year}
            month={cursor.month}
            onChange={updateActive}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        )}
        {view === 'ranks' && (
          <RankBoard
            classroom={classroom}
            year={cursor.year}
            month={cursor.month}
            onOpenReport={openReport}
            onToast={setToast}
          />
        )}
        {view === 'reports' && (
          <ReportDesk
            classroom={classroom}
            year={cursor.year}
            month={cursor.month}
            studentId={reportStudentId}
            onSelect={setReportStudentId}
            onToast={setToast}
          />
        )}
      </main>
      {narrow && <nav className="bottom-nav">{nav}</nav>}
      {settingsOpen && (
        <SettingsDialog
          store={store}
          classroom={classroom}
          onChangeClass={updateActive}
          onChangeStore={setStore}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
