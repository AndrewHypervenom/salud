import clsx from 'clsx'

export function Input({ label, error, className, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
      <input
        className={clsx(
          'block w-full rounded-xl border-gray-300 h-12 px-3 text-base',
          'focus:border-brand-500 focus:ring-brand-500',
          'dark:bg-[#13131F] dark:border-brand-500/20 dark:text-gray-200 dark:focus:border-brand-400 dark:placeholder-gray-500',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className,
        )}
        {...props}
      />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
