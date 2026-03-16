import clsx from 'clsx'

export function Card({ children, className, ...props }) {
  return (
    <div
      className={clsx('bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4', className)}
      {...props}
    >
      {children}
    </div>
  )
}
