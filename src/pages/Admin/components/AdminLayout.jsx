export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Top glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
      />
      <div className="relative max-w-5xl mx-auto px-4 py-8 pb-20">
        {children}
      </div>
    </div>
  )
}
