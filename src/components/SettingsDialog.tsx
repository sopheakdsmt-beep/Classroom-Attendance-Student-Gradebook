import { useRef, useState } from 'react'
import { downloadText } from '../lib/download'
import { emptyFrom, seedStore } from '../lib/seed'
import { sanitizeStore } from '../lib/storage'
import type { Classroom, Gender, Store, Subject } from '../lib/types'
import { MAX_STUDENTS } from '../lib/types'

interface Props {
  store: Store
  classroom: Classroom
  onChangeClass: (next: Classroom) => void
  onChangeStore: (next: Store) => void
  onClose: () => void
}

export function SettingsDialog({ store, classroom, onChangeClass, onChangeStore, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const atCapacity = classroom.students.length >= MAX_STUDENTS

  function patch(partial: Partial<Classroom>) {
    onChangeClass({ ...classroom, ...partial })
  }

  function updateSubject(id: string, partial: Partial<Subject>) {
    patch({
      subjects: classroom.subjects.map((subject) => (subject.id === id ? { ...subject, ...partial } : subject)),
    })
  }

  function removeSubject(id: string) {
    const grades = { ...classroom.grades }
    for (const key of Object.keys(grades)) {
      if (key.endsWith(`|${id}`)) delete grades[key]
    }
    patch({ subjects: classroom.subjects.filter((subject) => subject.id !== id), grades })
  }

  function updateStudent(id: string, name: string, gender: Gender) {
    patch({
      students: classroom.students.map((student) => (student.id === id ? { ...student, name, gender } : student)),
    })
  }

  function moveStudent(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= classroom.students.length) return
    const students = classroom.students.slice()
    const [row] = students.splice(index, 1)
    students.splice(target, 0, row)
    patch({ students })
  }

  function removeStudent(id: string) {
    const attendance = { ...classroom.attendance }
    const grades = { ...classroom.grades }
    for (const key of Object.keys(attendance)) {
      if (key.startsWith(`${id}|`)) delete attendance[key]
    }
    for (const key of Object.keys(grades)) {
      if (key.split('|')[1] === id) delete grades[key]
    }
    patch({
      students: classroom.students.filter((student) => student.id !== id),
      attendance,
      grades,
    })
  }

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="dialog-head">
          <div>
            <h2 id="settings-title">កំណត់ថ្នាក់</h2>
            <p>ទិន្នន័យរក្សាទុកក្នុងថេប្លេតនេះ មិនបានផ្ញើទៅម៉ាស៊ីនមេទេ។</p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onClose}>បិទ</button>
        </header>
        {error && <p className="dock-error">{error}</p>}
        <div className="dialog-grid">
          <section>
            <h3>ព័ត៌មានថ្នាក់</h3>
            <label>សាលា<input value={classroom.schoolName} onChange={(event) => patch({ schoolName: event.target.value })} /></label>
            <label>ថ្នាក់<input value={classroom.className} onChange={(event) => patch({ className: event.target.value })} /></label>
            <label>គ្រូបន្ទុកថ្នាក់<input value={classroom.teacherName} onChange={(event) => patch({ teacherName: event.target.value })} /></label>
            <label>ឆ្នាំសិក្សា<input value={classroom.academicYear} onChange={(event) => patch({ academicYear: event.target.value })} /></label>
            <label>
              ពិន្ទុជាប់លើមាត្រដ្ឋាន ១០
              <input
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={classroom.passMark}
                onChange={(event) => patch({ passMark: Number(event.target.value) })}
              />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={classroom.officialHeader}
                onChange={(event) => patch({ officialHeader: event.target.checked })}
              />
              បង្ហាញបឋមកថាផ្លូវការ
            </label>
            <label>
              ប្តូរថ្នាក់
              <select
                value={classroom.id}
                onChange={(event) => onChangeStore({ ...store, activeClassId: event.target.value })}
              >
                {store.classes.map((item) => (
                  <option key={item.id} value={item.id}>{item.className}</option>
                ))}
              </select>
            </label>
            <div className="dialog-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  const created = emptyFrom(classroom)
                  onChangeStore({ ...store, activeClassId: created.id, classes: [...store.classes, created] })
                }}
              >
                បន្ថែមថ្នាក់
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={store.classes.length < 2}
                onClick={() => {
                  const classes = store.classes.filter((item) => item.id !== classroom.id)
                  onChangeStore({ version: 1, activeClassId: classes[0].id, classes })
                }}
              >
                លុបថ្នាក់នេះ
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => downloadText('សៀវភៅបញ្ជី.json', JSON.stringify(store, null, 2), { mime: 'application/json' })}>
                នាំចេញ
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>នាំចូល</button>
              <input
                ref={fileRef}
                hidden
                type="file"
                accept="application/json"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (!file) return
                  void file.text().then((text) => {
                    try {
                      const parsed = sanitizeStore(JSON.parse(text))
                      if (!parsed) {
                        setError('ឯកសារមិនត្រឹមត្រូវ')
                        return
                      }
                      setError('')
                      onChangeStore(parsed)
                    } catch {
                      setError('ឯកសារមិនត្រឹមត្រូវ')
                    }
                  })
                }}
              />
              {confirmReset ? (
                <>
                  <button type="button" className="btn btn-primary" onClick={() => { onChangeStore(seedStore()); setConfirmReset(false) }}>ស្តារគំរូ</button>
                  <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(false)}>បោះបង់</button>
                </>
              ) : (
                <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(true)}>ស្តារទិន្នន័យគំរូ</button>
              )}
            </div>
          </section>
          <section>
            <h3>មុខវិជ្ជា</h3>
            <ul className="edit-list">
              {classroom.subjects.map((subject) => (
                <li key={subject.id}>
                  <input aria-label="ឈ្មោះមុខវិជ្ជា" value={subject.name} onChange={(event) => updateSubject(subject.id, { name: event.target.value })} />
                  <label>
                    មេគុណ
                    <input
                      aria-label={`មេគុណ ${subject.name}`}
                      type="number"
                      min={0}
                      step={1}
                      value={subject.coefficient}
                      onChange={(event) => updateSubject(subject.id, { coefficient: Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    អតិបរមា
                    <input
                      aria-label={`ពិន្ទុអតិបរមា ${subject.name}`}
                      type="number"
                      min={1}
                      step={1}
                      value={subject.maxScore}
                      onChange={(event) => updateSubject(subject.id, { maxScore: Number(event.target.value) })}
                    />
                  </label>
                  <button type="button" className="btn btn-ghost" onClick={() => removeSubject(subject.id)}>លុប</button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() =>
                patch({
                  subjects: [...classroom.subjects, { id: `sub-${crypto.randomUUID()}`, name: 'មុខវិជ្ជាថ្មី', coefficient: 1, maxScore: 10 }],
                })
              }
            >
              បន្ថែមមុខវិជ្ជា
            </button>
          </section>
          <section>
            <h3>បញ្ជីសិស្ស {classroom.students.length}/{MAX_STUDENTS}</h3>
            <ul className="edit-list students">
              {classroom.students.map((student, index) => (
                <li key={student.id}>
                  <span className="roster-no">{index + 1}</span>
                  <input
                    aria-label={`ឈ្មោះសិស្សទី ${index + 1}`}
                    value={student.name}
                    onChange={(event) => updateStudent(student.id, event.target.value, student.gender)}
                  />
                  <select
                    aria-label="ភេទ"
                    value={student.gender}
                    onChange={(event) => updateStudent(student.id, student.name, event.target.value as Gender)}
                  >
                    <option value="male">ប្រុស</option>
                    <option value="female">ស្រី</option>
                  </select>
                  <button type="button" className="btn btn-ghost" aria-label="រំកិលឡើង" disabled={index === 0} onClick={() => moveStudent(index, -1)}>↑</button>
                  <button type="button" className="btn btn-ghost" aria-label="រំកិលចុះ" disabled={index === classroom.students.length - 1} onClick={() => moveStudent(index, 1)}>↓</button>
                  <button type="button" className="btn btn-ghost" onClick={() => removeStudent(student.id)}>លុប</button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn btn-primary"
              disabled={atCapacity}
              onClick={() => {
                if (atCapacity) {
                  setError('សៀវភៅបញ្ជីនេះផ្ទុកសិស្សបាន ៤០នាក់ ក្នុងមួយថ្នាក់ ដើម្បីឲ្យឃើញទាំងអស់លើអេក្រង់តែមួយ។')
                  return
                }
                setError('')
                patch({
                  students: [...classroom.students, { id: `stu-${crypto.randomUUID()}`, name: 'សិស្សថ្មី', gender: 'female' }],
                })
              }}
            >
              បន្ថែមសិស្ស
            </button>
            {atCapacity && <p className="legend-note">ពេញ ៤០នាក់ហើយ ដើម្បីឲ្យតារាងនៅតែចូលក្នុងអេក្រង់តែមួយ។</p>}
          </section>
        </div>
      </div>
    </div>
  )
}
