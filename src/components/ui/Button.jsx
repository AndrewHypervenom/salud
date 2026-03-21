import clsx from 'clsx'

const variants = {
  primary: 'bg-gradient-to-r from-brand-500 to-blue-500 hover:from-brand-600 hover:to-blue-600 text-white shadow-glow-brand active:scale-[0.98]',
  secondary: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 dark:bg-[#13131F] dark:border-brand-500/20 dark:text-gray-200 dark:hover:bg-brand-500/5',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  ghost: 'hover:bg-gray-100 text-gray-700 dark:hover:bg-brand-500/8 dark:text-gray-300',
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
