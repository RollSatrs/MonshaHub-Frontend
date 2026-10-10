export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="modern-panel flex flex-wrap items-center justify-between gap-3 rounded-xl border-t-[3px] border-t-primary px-4 py-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground mt-0.5 max-w-4xl text-sm">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
