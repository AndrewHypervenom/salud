import clsx from 'clsx'

const variants = {
  default:        'bg-white dark:bg-[#13131F] shadow-[0_2px_16px_rgba(99,102,241,0.06)] dark:shadow-none dark:ring-1 dark:ring-brand-500/10',
  glass:          'glass-card',
  flat:           'bg-white dark:bg-[#13131F] ring-1 ring-black/5 dark:ring-brand-500/10',
  'glass-violet': 'glass-card-violet',
  'glass-sky':    'glass-card-sky',
  'glass-amber':  'glass-card-amber',
  'glass-emerald':'glass-card-emerald',
  'glass-rose':   'glass-card-rose',
  'glass-indigo': 'glass-card-indigo',
}

export function Card({ children, className, variant = 'default', ...props }) {
  return (
    <div
      className={clsx('rounded-2xl p-4', variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  )
}
