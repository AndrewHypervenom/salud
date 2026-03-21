import clsx from 'clsx'

export function Card({ children, className, variant, ...props }) {
  return (
    <div
      className={clsx(
        'card rounded-2xl p-4',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
