import clsx from 'clsx'

const variants = {
  primary:   'bg-brand-600 hover:bg-brand-700 text-white shadow-sm active:scale-[0.98]',
  secondary: 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700',
  danger:    'bg-red-600 hover:bg-red-700 text-white',
  ghost:     'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300',
}

export function Button({ children, variant = 'primary', className, disabled, ...props }) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 font-medium',
        'min-h-[48px] transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
