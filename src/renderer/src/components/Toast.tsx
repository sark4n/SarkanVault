import { X } from 'lucide-react'

interface ToastProps {
  message?: string
  tone?: 'success' | 'error' | 'info'
  onDismiss: () => void
}

export function Toast({ message, tone = 'info', onDismiss }: ToastProps): JSX.Element | null {
  if (!message) return null

  const toneClass =
    tone === 'success'
      ? 'border-mint/30 bg-mint/14 text-mint'
      : tone === 'error'
        ? 'border-pulse/30 bg-pulse/14 text-pulse'
        : 'border-white/12 bg-white/10 text-white'

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex max-w-md items-start gap-3 rounded-lg border px-4 py-3 shadow-card backdrop-blur-2xl ${toneClass}`}
    >
      <p className="text-sm font-semibold leading-5">{message}</p>
      <button type="button" onClick={onDismiss} className="rounded-md p-1 hover:bg-white/10" title="Cerrar">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
