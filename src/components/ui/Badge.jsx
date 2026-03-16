import clsx from 'clsx'

export function Badge({ children, className }) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', className)}>
      {children}
    </span>
  )
}
