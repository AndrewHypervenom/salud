import clsx from 'clsx'

export function Card({ children, className, ...props }) {
  return (
    <div
      className={clsx('bg-white dark:bg-gray-800 rounded-2xl shadow-md dark:shadow-none dark:ring-1 dark:ring-white/5 p-4', className)}
      {...props}
    >
      {children}
    </div>
  )
}
