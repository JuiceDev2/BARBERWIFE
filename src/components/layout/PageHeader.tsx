interface Props {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6 bg-white border-b"
         style={{ borderColor: 'var(--color-warm-300)' }}>
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-bold truncate" style={{ color: 'var(--color-warm-900)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-warm-500)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
