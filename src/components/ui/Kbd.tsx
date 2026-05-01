export default function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 bg-white border border-gray-200 rounded shadow-[0_1px_0_rgba(0,0,0,0.12)] font-mono leading-none select-none">
      {children}
    </kbd>
  )
}
