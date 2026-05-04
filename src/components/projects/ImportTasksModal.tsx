import { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, X } from 'lucide-react'
import { parseCsvToImportTasksBody, useImportTasksMutation } from '../../queries/import-export.queries'
import type { ImportTasksBody } from '../../types/import-export.types'
import type { ApiError } from '../../types/api.types'

const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const

type FieldErrors = Record<string, string>

function validate(body: ImportTasksBody): FieldErrors {
  const e: FieldErrors = {}
  body.tasks.forEach((task, ti) => {
    if (!task.title.trim())    e[`t${ti}.title`]    = 'Required'
    if (!task.priority.trim()) e[`t${ti}.priority`] = 'Required'
    task.subtasks.forEach((sub, si) => {
      if (!sub.title.trim())    e[`t${ti}s${si}.title`]    = 'Required'
      if (!sub.priority.trim()) e[`t${ti}s${si}.priority`] = 'Required'
    })
  })
  return e
}

interface Props {
  projectId:    string
  projectTitle: string
  onClose:      () => void
}

export default function ImportTasksModal({ projectId, projectTitle, onClose }: Props) {
  const [body,      setBody]      = useState<ImportTasksBody | null>(null)
  const [parseErrs, setParseErrs] = useState<string[]>([])
  const [fileName,  setFileName]  = useState('')
  const [touched,   setTouched]   = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { mutate: importTasks, isPending, error: mutationError } = useImportTasksMutation()
  const apiError    = mutationError as ApiError | null
  const fieldErrors = body ? validate(body) : {}
  const hasErrors   = Object.keys(fieldErrors).length > 0

  // ── file handling ──────────────────────────────────────────────────────────

  function handleFile(file: File) {
    setFileName(file.name)
    setBody(null)
    setParseErrs([])
    setTouched(false)

    if (file.name.endsWith('.json')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string)
          // Ensure projectId matches
          json.projectId = projectId
          json.projectTitle = projectTitle
          setBody(json)
          setTouched(true)
        } catch (err) {
          setParseErrs(['Invalid JSON file'])
        }
      }
      reader.readAsText(file)
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const result = parseCsvToImportTasksBody(text, projectId, projectTitle)
        if (result.errors.length > 0) {
          setParseErrs(result.errors)
        } else {
          setBody(result.body)
          setTouched(true)
        }
      }
      reader.readAsText(file)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  // ── body updaters ──────────────────────────────────────────────────────────

  function updateTask(ti: number, field: string, value: string) {
    setBody((prev) => {
      if (!prev) return prev
      const tasks = prev.tasks.map((t, i) => i === ti ? { ...t, [field]: value } : t)
      return { ...prev, tasks }
    })
  }

  function updateSubtask(ti: number, si: number, field: string, value: string) {
    setBody((prev) => {
      if (!prev) return prev
      const tasks = prev.tasks.map((t, i) => {
        if (i !== ti) return t
        const subtasks = t.subtasks.map((s, j) => j === si ? { ...s, [field]: value } : s)
        return { ...t, subtasks }
      })
      return { ...prev, tasks }
    })
  }

  // ── submit ─────────────────────────────────────────────────────────────────

  function handleSubmit() {
    if (!body || !projectId || hasErrors) return
    importTasks({ projectId, body }, { onSuccess: onClose })
  }

  // ── shared field classes ───────────────────────────────────────────────────

  const fieldCls = (errKey: string) =>
    `border rounded px-2 py-1 text-xs outline-none bg-white transition-colors ${
      touched && fieldErrors[errKey]
        ? 'border-red-400 bg-red-50 focus:border-red-500'
        : 'border-gray-200 focus:border-orange-400'
    }`

  const labelErrCls = 'text-red-500 text-[10px] leading-none'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col max-h-[90vh]">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Upload size={14} className="text-orange-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-800 leading-none">Import Tasks</h2>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-medium">To {projectTitle}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded cursor-pointer">
          <X size={16} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl px-4 py-5 flex items-center gap-3 cursor-pointer transition-colors ${
            body ? 'border-orange-300 bg-orange-50' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
          }`}
        >
          <FileText size={20} className={body ? 'text-orange-400' : 'text-gray-300'} />
          <div className="flex-1 min-w-0">
            {fileName ? (
              <p className="text-sm font-medium text-gray-700 truncate">{fileName}</p>
            ) : (
              <p className="text-sm font-medium text-gray-600">Drop CSV/JSON file here or click to browse</p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">
              {body ? 'Click to replace file' : 'Import tasks from a previously exported file'}
            </p>
          </div>
          <input ref={fileInputRef} type="file" accept=".csv,.json" className="hidden" onChange={handleInputChange} />
        </div>

        {/* Parse errors */}
        {parseErrs.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-3 space-y-1">
            <div className="flex items-center gap-1.5 text-red-600 font-medium text-xs">
              <AlertCircle size={13} /> Invalid file — fix these issues and re-upload
            </div>
            {parseErrs.map((err, i) => (
              <p key={i} className="text-xs text-red-500 pl-5">{err}</p>
            ))}
          </div>
        )}

        {/* API error */}
        {apiError?.message && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg flex items-center gap-1.5">
            <AlertCircle size={12} /> {apiError.message}
          </div>
        )}

        {/* Editable preview */}
        {body && (
          <div className="space-y-4">

            {/* Validation banner */}
            {touched && hasErrors && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 rounded-lg flex items-center gap-1.5">
                <AlertCircle size={12} />
                {Object.keys(fieldErrors).length} field{Object.keys(fieldErrors).length !== 1 ? 's' : ''} need attention
              </div>
            )}

            {/* Tasks + Subtasks */}
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tasks & Subtasks</span>
                <span className="text-xs text-gray-400">
                  {body.tasks.length} task{body.tasks.length !== 1 ? 's' : ''} ·{' '}
                  {body.tasks.reduce((a, t) => a + t.subtasks.length, 0)} subtask{body.tasks.reduce((a, t) => a + t.subtasks.length, 0) !== 1 ? 's' : ''}
                </span>
              </div>

              {body.tasks.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-gray-400">No tasks found in this file</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {body.tasks.map((task, ti) => (
                    <div key={ti}>

                      {/* Task row */}
                      <div className="px-4 py-3 bg-white">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-[10px] font-semibold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase tracking-wide">Task</span>
                          <span className="text-[10px] text-gray-400">#{ti + 1}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">

                          {/* Title */}
                          <div className="sm:col-span-2 flex flex-col gap-0.5">
                            <label className="text-[10px] text-gray-400">Title <span className="text-red-400">*</span></label>
                            <input
                              value={task.title}
                              onChange={(e) => updateTask(ti, 'title', e.target.value)}
                              className={`${fieldCls(`t${ti}.title`)} w-full`}
                              placeholder="Task title"
                            />
                            {touched && fieldErrors[`t${ti}.title`] && <span className={labelErrCls}>{fieldErrors[`t${ti}.title`]}</span>}
                          </div>

                          {/* Priority */}
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[10px] text-gray-400">Priority <span className="text-red-400">*</span></label>
                            <select
                              value={task.priority}
                              onChange={(e) => updateTask(ti, 'priority', e.target.value)}
                              className={`${fieldCls(`t${ti}.priority`)} w-full cursor-pointer`}
                            >
                              <option value="">Select</option>
                              {TASK_PRIORITIES.map((p) => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                            {touched && fieldErrors[`t${ti}.priority`] && <span className={labelErrCls}>{fieldErrors[`t${ti}.priority`]}</span>}
                          </div>

                          {/* Due Date */}
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[10px] text-gray-400">Due Date</label>
                            <input
                              type="date"
                              value={task.dueDate ?? ''}
                              onChange={(e) => updateTask(ti, 'dueDate', e.target.value || '')}
                              className="border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:border-orange-400 bg-white w-full"
                            />
                          </div>

                          {/* Assignees */}
                          <div className="sm:col-span-4 flex flex-col gap-0.5">
                            <label className="text-[10px] text-gray-400">Assignees (emails, semicolon-separated)</label>
                            <input
                              value={task.assigneeEmails.join(';')}
                              onChange={(e) =>
                                updateTask(ti, 'assigneeEmails', e.target.value as any)
                              }
                              onBlur={(e) => {
                                const emails = e.target.value.split(';').map((x) => x.trim()).filter(Boolean)
                                setBody((prev) => {
                                  if (!prev) return prev
                                  const tasks = prev.tasks.map((t, i) =>
                                    i === ti ? { ...t, assigneeEmails: emails } : t
                                  )
                                  return { ...prev, tasks }
                                })
                              }}
                              className="border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:border-orange-400 bg-white w-full"
                              placeholder="user@example.com;other@example.com"
                            />
                          </div>

                        </div>
                      </div>

                      {/* Subtask rows */}
                      {task.subtasks.map((sub, si) => (
                        <div key={si} className="pl-8 pr-4 py-2.5 bg-gray-50/60 border-t border-dashed border-gray-100">
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-[10px] font-semibold bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded uppercase tracking-wide">Subtask</span>
                            <span className="text-[10px] text-gray-400">#{si + 1}</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">

                            <div className="sm:col-span-2 flex flex-col gap-0.5">
                              <label className="text-[10px] text-gray-400">Title <span className="text-red-400">*</span></label>
                              <input
                                value={sub.title}
                                onChange={(e) => updateSubtask(ti, si, 'title', e.target.value)}
                                className={`${fieldCls(`t${ti}s${si}.title`)} w-full`}
                                placeholder="Subtask title"
                              />
                              {touched && fieldErrors[`t${ti}s${si}.title`] && <span className={labelErrCls}>{fieldErrors[`t${ti}s${si}.title`]}</span>}
                            </div>

                            <div className="flex flex-col gap-0.5">
                              <label className="text-[10px] text-gray-400">Priority <span className="text-red-400">*</span></label>
                              <select
                                value={sub.priority}
                                onChange={(e) => updateSubtask(ti, si, 'priority', e.target.value)}
                                className={`${fieldCls(`t${ti}s${si}.priority`)} w-full cursor-pointer`}
                              >
                                <option value="">Select</option>
                                {TASK_PRIORITIES.map((p) => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                              </select>
                              {touched && fieldErrors[`t${ti}s${si}.priority`] && <span className={labelErrCls}>{fieldErrors[`t${ti}s${si}.priority`]}</span>}
                            </div>

                            <div className="flex flex-col gap-0.5">
                              <label className="text-[10px] text-gray-400">Due Date</label>
                              <input
                                type="date"
                                value={sub.dueDate ?? ''}
                                onChange={(e) => updateSubtask(ti, si, 'dueDate', e.target.value || '')}
                                className="border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:border-orange-400 bg-white w-full"
                              />
                            </div>

                            <div className="sm:col-span-4 flex flex-col gap-0.5">
                              <label className="text-[10px] text-gray-400">Assignees (emails, semicolon-separated)</label>
                              <input
                                value={sub.assigneeEmails.join(';')}
                                onChange={(e) =>
                                  updateSubtask(ti, si, 'assigneeEmails', e.target.value as any)
                                }
                                onBlur={(e) => {
                                  const emails = e.target.value.split(';').map((x) => x.trim()).filter(Boolean)
                                  setBody((prev) => {
                                    if (!prev) return prev
                                    const tasks = prev.tasks.map((t, i) => {
                                      if (i !== ti) return t
                                      const subtasks = t.subtasks.map((s, j) =>
                                        j === si ? { ...s, assigneeEmails: emails } : s
                                      )
                                      return { ...t, subtasks }
                                    })
                                    return { ...prev, tasks }
                                  })
                                }}
                                className="border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:border-orange-400 bg-white w-full"
                                placeholder="user@example.com;other@example.com"
                              />
                            </div>

                          </div>
                        </div>
                      ))}

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Footer */}
      <div className="flex gap-3 px-5 py-4 border-t border-gray-100 flex-shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!body || hasErrors || isPending}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Importing...' : 'Import Tasks'}
        </button>
      </div>

    </div>
  )
}
