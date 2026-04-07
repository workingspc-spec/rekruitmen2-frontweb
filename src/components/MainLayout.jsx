import Sidebar from './Sidebar'

export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto page-enter">
          {children}
        </div>
      </main>
    </div>
  )
}