import clsx from 'clsx'

const variants = {
  default: 'bg-white dark:bg-ios-dark shadow-ios dark:shadow-none dark:ring-1 dark:ring-white/6',
  glass:   'glass-card',
  flat:    'bg-white dark:bg-ios-dark ring-1 ring-black/5 dark:ring-white/6',
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
