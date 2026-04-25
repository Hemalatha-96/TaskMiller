export function DashboardFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="fixed bottom-0 left-[220px] right-0 h-12 bg-white border-t border-gray-100 flex items-center justify-between px-6 z-20 shadow-[0_-1px_0_rgba(0,0,0,0.02)]">
      <p className="text-xs text-gray-500">
        &copy; {year} <span className="font-medium text-gray-700">Task Miller</span>
      </p>
      <p className="text-xs text-gray-400 hidden sm:block">
        Built with TanStack Start
      </p>
    </footer>
  )
}
