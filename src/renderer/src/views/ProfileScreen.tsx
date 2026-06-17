// ── Profile Screen — editar perfil activo ────────────────────────────────────

import { useCallback, useRef, useState } from 'react'
import { Camera, Check, UserCircle2, ArrowLeft } from 'lucide-react'
import { type UserProfile, updateProfile, getInitials } from '@renderer/lib/profileStore'

interface ProfileScreenProps {
  profile: UserProfile
  onSave: (updated: UserProfile) => void
  onBack: () => void
}

export function ProfileScreen({ profile, onSave, onBack }: ProfileScreenProps): JSX.Element {
  const [nickname, setNickname] = useState(profile.nickname)
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(profile.avatarUrl)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePickImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleSave = useCallback(() => {
    const updated = updateProfile(profile.id, {
      nickname: nickname.trim() || profile.nickname,
      avatarUrl: avatarPreview,
    })
    if (updated) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      onSave(updated)
    }
  }, [nickname, avatarPreview, profile.id, profile.nickname, onSave])

  const isDirty = nickname !== profile.nickname || avatarPreview !== profile.avatarUrl

  return (
    <div className="mx-auto max-w-md animate-view-in">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Mi Perfil</h1>
          <p className="text-xs text-white/40">Personaliza tu apodo y foto</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl shadow-xl">
        {/* Avatar */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative group h-28 w-28 rounded-full overflow-hidden border-2 border-dashed border-white/20 hover:border-mint/60 transition-all"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <div
                className="h-full w-full flex items-center justify-center text-3xl font-bold text-night"
                style={{ backgroundColor: profile.avatarColor }}
              >
                {getInitials(nickname || profile.nickname)}
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <Camera className="h-7 w-7 text-white" />
            </div>
          </button>
          <span className="text-xs text-white/30">Toca para cambiar foto</span>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePickImage} />
          {avatarPreview && (
            <button
              type="button"
              onClick={() => setAvatarPreview(undefined)}
              className="text-xs text-white/30 hover:text-red-400 transition underline"
            >
              Quitar foto
            </button>
          )}
        </div>

        {/* Nickname */}
        <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-1.5">
          Apodo
        </label>
        <input
          type="text"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder={profile.nickname}
          maxLength={20}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-mint/50 focus:ring-1 focus:ring-mint/30 transition mb-6"
        />

        {/* Member since */}
        <p className="text-xs text-white/25 mb-6">
          Miembro desde {new Date(profile.createdAt).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty}
          className={`w-full h-11 rounded-xl font-bold text-sm transition-all ${
            saved
              ? 'bg-mint/80 text-night'
              : isDirty
              ? 'bg-mint text-night hover:brightness-110 active:scale-95'
              : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/8'
          }`}
        >
          {saved ? (
            <span className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4" /> Guardado
            </span>
          ) : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
