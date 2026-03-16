import clsx from 'clsx'

export function Select({ label, error, children, className, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <select
        className={clsx(
          'block w-full rounded-xl border-gray-300 h-12 px-3 text-base',
          'focus:border-primary-500 focus:ring-primary-500',
          error && 'border-red-500',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
