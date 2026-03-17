import clsx from 'clsx'

export function Select({ label, error, children, className, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
      <select
        className={clsx(
          'block w-full rounded-xl border-gray-300 h-12 px-3 text-base',
          'focus:border-primary-500 focus:ring-primary-500',
          'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:border-primary-400',
          error && 'border-red-500',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
