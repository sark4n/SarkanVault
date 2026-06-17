// ── Profile Selector — pantalla de selección de perfil al iniciar ─────────────

import { useCallback, useRef, useState } from 'react'
import { Plus, Trash2, UserCircle2, Check, X, Camera } from 'lucide-react'
import {
  type UserProfile,
  getProfiles,
  createProfile,
  deleteProfile,
  getInitials,
} from '@renderer/lib/profileStore'

interface ProfileSelectorProps {
  onSelect: (profile: UserProfile) => void
}

export function ProfileSelector({ onSelect }: ProfileSelectorProps): JSX.Element {
  const [profiles, setProfiles] = useState<UserProfile[]>(() => getProfiles())
  const [creating, setCreating] = useState(profiles.length === 0) // abrir form si no hay perfiles
  const [nickname, setNickname] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>()
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePickImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleCreate = useCallback(() => {
    const p = createProfile(nickname || 'Jugador', avatarPreview)
    setProfiles(getProfiles())
    setCreating(false)
    setNickname('')
    setAvatarPreview(undefined)
    onSelect(p)
  }, [nickname, avatarPreview, onSelect])

  const handleDelete = useCallback((id: string) => {
    deleteProfile(id)
    setProfiles(getProfiles())
    setDeleteConfirm(null)
  }, [])

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-night">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(92,242,196,0.12),transparent_60%),radial-gradient(ellipse_at_80%_80%,rgba(255,79,139,0.10),transparent_50%)]" />
      </div>

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center px-6">
        {/* Logo */}
        <h1 className="mb-2 text-3xl font-extrabold uppercase tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-purple-400">
          SarkaN Vault
        </h1>
        <p className="mb-10 text-sm text-white/40 tracking-widest uppercase">
          {creating ? 'Crea tu perfil' : '¿Quién juega hoy?'}
        </p>

        {/* ── Create form ── */}
        {creating ? (
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl shadow-2xl animate-fadeUp">
            {/* Avatar picker */}
            <div className="flex flex-col items-center gap-3 mb-6">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative group flex h-24 w-24 items-center justify-center rounded-full overflow-hidden border-2 border-dashed border-white/20 hover:border-mint/60 transition-all"
                style={!avatarPreview ? { background: 'rgba(255,255,255,0.05)' } : undefined}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <UserCircle2 className="h-10 w-10 text-white/30 group-hover:text-mint/60 transition" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </button>
              <span className="text-xs text-white/30">Toca para elegir foto</span>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePickImage} />
            </div>

            {/* Nickname */}
            <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-1.5">
              Apodo
            </label>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Ej: SarkanPlayer"
              maxLength={20}
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-mint/50 focus:ring-1 focus:ring-mint/30 transition mb-5"
            />

            <div className="flex gap-2">
              {profiles.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setCreating(false); setNickname(''); setAvatarPreview(undefined) }}
                  className="flex-1 h-11 rounded-xl border border-white/10 bg-white/5 text-sm text-white/60 hover:text-white hover:bg-white/10 transition"
                >
                  Cancelar
                </button>
              )}
              <button
                type="button"
                onClick={handleCreate}
                disabled={!nickname.trim()}
                className="flex-1 h-11 rounded-xl bg-mint text-night font-bold text-sm hover:brightness-110 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Crear perfil
              </button>
            </div>
          </div>
        ) : (
          /* ── Profile grid ── */
          <div className="w-full">
            <div className="grid grid-cols-3 gap-4 mb-6 sm:grid-cols-4">
              {profiles.map(p => (
                <div key={p.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => onSelect(p)}
                    className="w-full flex flex-col items-center gap-2.5 rounded-2xl border border-white/8 bg-white/[0.04] p-4 hover:bg-white/[0.08] hover:border-white/20 hover:scale-105 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-mint focus-visible:outline-none"
                  >
                    {/* Avatar */}
                    <div
                      className="h-16 w-16 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold text-night shadow-lg"
                      style={!p.avatarUrl ? { backgroundColor: p.avatarColor } : undefined}
                    >
                      {p.avatarUrl
                        ? <img src={p.avatarUrl} alt={p.nickname} className="h-full w-full object-cover" />
                        : getInitials(p.nickname)
                      }
                    </div>
                    <span className="text-sm font-semibold text-white truncate w-full text-center">{p.nickname}</span>
                  </button>

                  {/* Delete button */}
                  {deleteConfirm === p.id ? (
                    <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-2 bg-black/80 backdrop-blur-sm border border-red-500/30">
                      <p className="text-xs text-white/70 text-center px-2">¿Eliminar perfil?</p>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/80 hover:bg-red-500 transition"
                        >
                          <Check className="h-3.5 w-3.5 text-white" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(null)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition"
                        >
                          <X className="h-3.5 w-3.5 text-white" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(p.id)}
                      className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-black/60 border border-white/10 text-white/30 hover:text-red-400 hover:border-red-400/40 transition opacity-0 group-hover:opacity-100 flex items-center justify-center"
                      aria-label="Eliminar perfil"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}

              {/* Add profile card */}
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex flex-col items-center gap-2.5 rounded-2xl border border-dashed border-white/15 p-4 text-white/30 hover:text-white/60 hover:border-white/30 hover:bg-white/[0.03] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-mint focus-visible:outline-none"
              >
                <div className="h-16 w-16 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium">Nuevo perfil</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
