import { Modal } from '../ui/modal'
import { Button } from '../ui/button'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  loading?: boolean
  error?: string
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Confirmation',
  message = 'Are you sure you want to delete this? This action cannot be undone.',
  loading,
  error,
}: ConfirmDeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 mb-4">{message}</p>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{error}</p>}
      <div className="sticky bottom-0 -mx-5 -mb-4 px-5 pb-4 pt-3 bg-white border-t border-gray-100 flex justify-end gap-3 mt-4 z-10">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>Delete</Button>
      </div>
    </Modal>
  )
}
