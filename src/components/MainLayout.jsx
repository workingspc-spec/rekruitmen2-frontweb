// src/components/MainLayout.jsx
import Sidebar from './Sidebar'

export default function MainLayout({ children }) {
  return (
    // h-screen + overflow-hidden: seluruh app terkunci di tinggi viewport
    // Scroll hanya terjadi di dalam <main>, bukan di window/body
    // Ini juga memastikan fixed modals selalu relatif ke viewport (bukan ancestor yg punya transform)
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto page-enter">
          {children}
        </div>
      </main>
    </div>
  )
}