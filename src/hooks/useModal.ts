import { useState } from 'react'

export function useModal<T = undefined>() {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<T | undefined>(undefined)

  const open = (payload?: T) => {
    setData(payload)
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    setData(undefined)
  }

  return { isOpen, data, open, close }
}
