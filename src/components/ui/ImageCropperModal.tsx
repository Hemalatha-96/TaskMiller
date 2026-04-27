import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import getCroppedImg from '../../lib/cropImage'
import type { PixelCrop } from '../../lib/cropImage'
import { X } from 'lucide-react'

interface ImageCropperModalProps {
  imageSrc: string
  fileName: string
  fileType: string
  onCancel: () => void
  onSave: (file: File) => Promise<void>
}

export default function ImageCropperModal({ imageSrc, fileName, fileType, onCancel, onSave }: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const onCropComplete = useCallback((_croppedArea: unknown, newCroppedAreaPixels: PixelCrop) => {
    setCroppedAreaPixels(newCroppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels) return
    setIsSaving(true)
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels, fileName, fileType)
      await onSave(croppedFile)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Adjust Profile Picture</h2>
          <button onClick={onCancel} disabled={isSaving} className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative w-full h-[300px] bg-gray-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1} // Square aspect ratio for avatar
            cropShape="round"
            showGrid={false}
            minZoom={0.1}
            maxZoom={3}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        {/* Zoom Slider & Actions */}
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-gray-500">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={0.1}
              max={3}
              step={0.05}
              aria-label="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60 flex items-center justify-center"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : 'Apply & Save'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
