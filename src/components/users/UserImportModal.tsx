import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Download, Upload } from 'lucide-react'
import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { ErrorMessage } from '../common/ErrorMessage'
import { createUser } from '../../lib/api/users.api'
import { KEYS } from '../../constants/queryKeys'
import type { CreateUserPayload } from '../../lib/api/users.api'

type RowIssue = { row: number; message: string }

type ImportRow = {
  row: number
  payload: CreateUserPayload
}

type ImportResult = {
  created: number
  failed: Array<{ row: number; email: string; message: string }>
}

function parseCsv(text: string): string[][] {
  const cleaned = text.replace(/^\uFEFF/, '')
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i]

    if (inQuotes) {
      if (ch === '"') {
        const next = cleaned[i + 1]
        if (next === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
      continue
    }

    if (ch === ',') {
      row.push(field)
      field = ''
      continue
    }

    if (ch === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      continue
    }

    if (ch === '\r') continue

    field += ch
  }

  row.push(field)
  const hasContent = row.some((c) => c.trim() !== '')
  if (hasContent) rows.push(row)

  return rows
}

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

function isValidEmail(email: string): boolean {
  return /^\S+@\S+\.\S+$/.test(email)
}

function downloadTemplate() {
  const csv = [
    'name,email,password,role',
    'Dev One,dev1@example.com,Password@123,developer',
    'Admin User,admin@example.com,Password@123,admin',
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'users_import_template.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function UserImportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const [fileName, setFileName] = useState('')
  const [parseError, setParseError] = useState('')
  const [rowIssues, setRowIssues] = useState<RowIssue[]>([])
  const [rowsToImport, setRowsToImport] = useState<ImportRow[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [result, setResult] = useState<ImportResult | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setFileName('')
      setParseError('')
      setRowIssues([])
      setRowsToImport([])
      setIsImporting(false)
      setProgress({ done: 0, total: 0 })
      setResult(null)
    }
  }, [isOpen])

  const summary = useMemo(() => {
    return { valid: rowsToImport.length, invalid: rowIssues.length }
  }, [rowsToImport.length, rowIssues.length])

  const handleFile = async (file: File | null) => {
    setResult(null)
    setParseError('')
    setRowIssues([])
    setRowsToImport([])
    setProgress({ done: 0, total: 0 })

    if (!file) {
      setFileName('')
      return
    }

    setFileName(file.name)

    try {
      const text = await file.text()
      const rows = parseCsv(text)
      if (rows.length === 0) {
        setParseError('CSV file is empty.')
        return
      }

      const header = rows[0].map((h) => normalizeHeader(h))
      const hasHeader = header.includes('email') || header.includes('name')

      const colIndex = (key: string, defaultIndex: number) => {
        if (!hasHeader) return defaultIndex
        const idx = header.findIndex((h) => h === key)
        return idx >= 0 ? idx : -1
      }

      const nameIdx = colIndex('name', 0)
      const emailIdx = colIndex('email', 1)
      const passwordIdx = colIndex('password', 2)
      const roleIdx = colIndex('role', 3)

      if (nameIdx < 0 || emailIdx < 0 || passwordIdx < 0) {
        setParseError('CSV must include columns: name, email, password (role is optional).')
        return
      }

      const start = hasHeader ? 1 : 0
      const issues: RowIssue[] = []
      const importRows: ImportRow[] = []

      for (let i = start; i < rows.length; i++) {
        const rowNumber = i + 1
        const cols = rows[i]

        const name = (cols[nameIdx] ?? '').trim()
        const email = (cols[emailIdx] ?? '').trim()
        const password = (cols[passwordIdx] ?? '').trim()
        const roleRaw = roleIdx >= 0 ? (cols[roleIdx] ?? '').trim().toLowerCase() : ''
        const role: CreateUserPayload['role'] = roleRaw === 'admin' ? 'admin' : 'developer'

        if (name.length < 2) {
          issues.push({ row: rowNumber, message: 'Name must be at least 2 characters.' })
          continue
        }
        if (!isValidEmail(email)) {
          issues.push({ row: rowNumber, message: 'Invalid email address.' })
          continue
        }
        if (password.length < 8) {
          issues.push({ row: rowNumber, message: 'Password must be at least 8 characters.' })
          continue
        }

        importRows.push({ row: rowNumber, payload: { name, email, password, role } })
      }

      setRowIssues(issues)
      setRowsToImport(importRows)
    } catch (err: any) {
      setParseError(err?.message ?? 'Failed to read CSV file.')
    }
  }

  const handleImport = async () => {
    setParseError('')
    setResult(null)
    setIsImporting(true)
    setProgress({ done: 0, total: rowsToImport.length })

    let created = 0
    const failed: ImportResult['failed'] = []

    for (let i = 0; i < rowsToImport.length; i++) {
      const row = rowsToImport[i]
      try {
        await createUser(row.payload)
        created += 1
      } catch (err: any) {
        failed.push({
          row: row.row,
          email: row.payload.email,
          message: err?.message ?? 'Failed to create user.',
        })
      } finally {
        setProgress({ done: i + 1, total: rowsToImport.length })
      }
    }

    await qc.invalidateQueries({ queryKey: KEYS.USERS })
    setResult({ created, failed })
    setIsImporting(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Users" size="lg">
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Upload a CSV with columns: <span className="font-medium">name, email, password, role</span> (role optional: admin|developer).
        </div>

        {parseError && <ErrorMessage message={parseError} />}

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-gray-700">CSV File</label>
            <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="w-4 h-4" />
              Template
            </Button>
          </div>
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={isImporting}
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-orange-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#F4622A] hover:file:bg-orange-100"
          />
          {fileName && <div className="text-xs text-gray-500">Selected: {fileName}</div>}
        </div>

        {(rowsToImport.length > 0 || rowIssues.length > 0) && (
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-800">Summary</div>
              <div className="text-xs text-gray-500">
                Valid: <span className="font-medium text-gray-800">{summary.valid}</span> &middot; Invalid:{' '}
                <span className="font-medium text-gray-800">{summary.invalid}</span>
              </div>
            </div>

            {rowIssues.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Invalid rows</div>
                <div className="max-h-28 overflow-y-auto space-y-1">
                  {rowIssues.slice(0, 20).map((e) => (
                    <div key={`${e.row}-${e.message}`} className="text-xs text-red-700">
                      Row {e.row}: {e.message}
                    </div>
                  ))}
                  {rowIssues.length > 20 && <div className="text-xs text-gray-500">…and {rowIssues.length - 20} more</div>}
                </div>
              </div>
            )}

            {result && (
              <div className="mt-4 space-y-2">
                <div className="text-sm text-gray-700">
                  Imported <span className="font-semibold">{result.created}</span> users
                  {result.failed.length ? (
                    <>
                      , <span className="font-semibold text-red-600">{result.failed.length}</span> failed.
                    </>
                  ) : (
                    '.'
                  )}
                </div>
                {result.failed.length > 0 && (
                  <div className="max-h-28 overflow-y-auto space-y-1">
                    {result.failed.slice(0, 20).map((f) => (
                      <div key={`${f.row}-${f.email}`} className="text-xs text-red-700">
                        Row {f.row} ({f.email}): {f.message}
                      </div>
                    ))}
                    {result.failed.length > 20 && <div className="text-xs text-gray-500">…and {result.failed.length - 20} more</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isImporting && (
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            Importing… {progress.done}/{progress.total}
          </div>
        )}

        <div className="sticky bottom-0 -mx-5 -mb-4 px-5 pb-4 pt-3 bg-white border-t border-gray-100 flex justify-end gap-3 mt-4 z-10">
          <Button type="button" variant="outline" onClick={onClose} disabled={isImporting}>
            Close
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            loading={isImporting}
            disabled={isImporting || rowsToImport.length === 0}
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
        </div>
      </div>
    </Modal>
  )
}

