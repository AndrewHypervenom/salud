export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-6 pb-16">
        {children}
      </div>
    </div>
  )
}
