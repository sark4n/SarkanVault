import { ChevronRight } from 'lucide-react'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
}

export function SectionHeader({ title, subtitle, actionLabel, onAction }: SectionHeaderProps): JSX.Element {
  return (
    <div className="mb-4 flex items-end justify-between gap-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">{title}</h2>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm text-white/54">{subtitle}</p> : null}
      </div>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex h-10 shrink-0 items-center gap-1 rounded-md border border-white/10 bg-white/6 px-4 text-sm font-bold text-white/82 transition hover:border-white/24 hover:bg-white/12"
        >
          {actionLabel}
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}
