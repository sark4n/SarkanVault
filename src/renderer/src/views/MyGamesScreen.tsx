import type { GameEntry, LibrarySnapshot } from '@shared/types'
import type { UserProfile } from '@renderer/lib/profileStore'
import { getInitials } from '@renderer/lib/profileStore'
import { GameCarousel } from '@renderer/components/GameCarousel'
import { Heart, Clock } from 'lucide-react'

interface MyGamesScreenProps {
  snapshot: LibrarySnapshot
  profile: UserProfile
  onOpenGame: (game: GameEntry) => void
  onLaunchGame: (game: GameEntry) => void
  onToggleHidden: (game: GameEntry) => void
}

export function MyGamesScreen({
  snapshot,
  profile,
  onOpenGame,
  onLaunchGame,
  onToggleHidden,
}: MyGamesScreenProps): JSX.Element {
  const recentlyPlayed = snapshot.recentlyPlayed.length
    ? snapshot.recentlyPlayed
    : snapshot.games.filter((g) => g.playCount > 0)

  const favorites = snapshot.favorites
  const hasContent = recentlyPlayed.length > 0 || favorites.length > 0

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="h-14 w-14 rounded-2xl overflow-hidden flex-none flex items-center justify-center text-lg font-bold text-night shadow-lg"
          style={!profile.avatarUrl ? { backgroundColor: profile.avatarColor } : undefined}
        >
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.nickname} className="h-full w-full object-cover" />
          ) : (
            getInitials(profile.nickname)
          )}
        </div>
        <div>
          <h2 className="font-display text-3xl font-bold text-white">Mis Juegos</h2>
          <p className="mt-0.5 text-sm text-white/54">
            {profile.nickname} · {recentlyPlayed.length} recientes · {favorites.length} favorito{favorites.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {hasContent ? (
        <>
        {favorites.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Heart className="h-5 w-5 text-fuchsia-400 fill-fuchsia-400" />
                <span className="font-display text-xl font-bold text-white">Favoritos</span>
              </div>
              <GameCarousel
                title=""
                subtitle={`${favorites.length} juego${favorites.length !== 1 ? 's' : ''} marcado${favorites.length !== 1 ? 's' : ''} como favorito`}
                games={favorites.slice(0, 24)}
                consoles={snapshot.consoles}
                onOpenGame={onOpenGame}
                onLaunchGame={onLaunchGame}
                onToggleHidden={onToggleHidden}
                compact
              />
            </div>
          )}
        {recentlyPlayed.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-300" />
                <span className="font-display text-xl font-bold text-white">Últimos jugados</span>
              </div>
              <GameCarousel
                title=""
                subtitle="Ordenados por tus lanzamientos más recientes."
                games={recentlyPlayed.slice(0, 24)}
                consoles={snapshot.consoles}
                onOpenGame={onOpenGame}
                onLaunchGame={onLaunchGame}
                onToggleHidden={onToggleHidden}
                compact
              />
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className="flex gap-3 text-white/20">
            <Clock className="h-10 w-10" />
            <Heart className="h-10 w-10" />
          </div>
          <p className="text-white/40 text-sm">Aún no tienes historial ni favoritos.</p>
          <p className="text-white/25 text-xs">Empieza a jugar y marca tus favoritos para verlos aquí.</p>
        </div>
      )}
    </div>
  )
}
