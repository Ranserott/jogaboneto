"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Crown, TrendingUp, User } from "lucide-react"

interface LeaderboardEntry {
  id: string
  rank: number
  xp: number
  points: number
  level: number
  streak: number
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

interface LeaderboardTableProps {
  currentUserId?: string
  initialData?: LeaderboardEntry[]
  surroundingPlayers?: LeaderboardEntry[]
}

export function LeaderboardTable({
  currentUserId,
  initialData = [],
  surroundingPlayers = [],
}: LeaderboardTableProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(initialData)
  const [period, setPeriod] = useState<"all" | "week" | "month">("all")
  const [loading, setLoading] = useState(false)
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null)

  useEffect(() => {
    if (currentUserId) {
      fetchCurrentUserRank()
    }
  }, [currentUserId])

  const fetchCurrentUserRank = async () => {
    try {
      const response = await fetch("/api/leaderboard?userId=me")
      const result = await response.json()

      if (result.success) {
        setCurrentUserRank(result.data)
      }
    } catch (error) {
      console.error("Error fetching current user rank:", error)
    }
  }

  const fetchLeaderboard = async (selectedPeriod: typeof period) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/leaderboard?limit=50&period=${selectedPeriod}`)
      const result = await response.json()

      if (result.success) {
        setLeaderboard(result.data)
        setPeriod(selectedPeriod)
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />
    return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>
  }

  const getRankBadgeVariant = (rank: number): "default" | "secondary" | "outline" => {
    if (rank <= 3) return "default"
    if (rank <= 10) return "secondary"
    return "outline"
  }

  const getAvatarColor = (userId: string) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-orange-500",
      "bg-red-500",
      "bg-green-500",
    ]
    const index = parseInt(userId.slice(-8), 16) % colors.length
    return colors[index]
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Ranking Global
            </CardTitle>
            <CardDescription>
              Los mejores jugadores de JogaBoneto
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={period === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => fetchLeaderboard("all")}
              disabled={loading}
            >
              Histórico
            </Button>
            <Button
              variant={period === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => fetchLeaderboard("week")}
              disabled={loading}
            >
              Semana
            </Button>
            <Button
              variant={period === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => fetchLeaderboard("month")}
              disabled={loading}
            >
              Mes
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5">Jugador</div>
            <div className="col-span-2 text-center">Nivel</div>
            <div className="col-span-2 text-right">XP</div>
            <div className="col-span-2 text-center">Racha</div>
          </div>

          {/* Leaderboard Entries */}
          {leaderboard.map((entry) => {
            const isCurrentUser = entry.user.id === currentUserId
            return (
              <div
                key={entry.id}
                className={`grid grid-cols-12 gap-4 px-4 py-3 rounded-lg items-center transition-colors ${
                  isCurrentUser
                    ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-500"
                    : "hover:bg-muted/50"
                }`}
              >
                <div className="col-span-1">
                  {getRankIcon(entry.rank)}
                </div>
                <div className="col-span-5 flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-full ${getAvatarColor(
                      entry.user.id
                    )} flex items-center justify-center text-white font-semibold text-sm`}
                  >
                    {entry.user.image ? (
                      <img
                        src={entry.user.image}
                        alt={entry.user.name || entry.user.email}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      getInitials(entry.user.name, entry.user.email)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {entry.user.name || entry.user.email.split("@")[0]}
                    </div>
                    {isCurrentUser && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        <User className="h-3 w-3 mr-1" />
                        Tú
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="col-span-2 text-center">
                  <Badge variant={getRankBadgeVariant(entry.rank)}>
                    Nivel {entry.level}
                  </Badge>
                </div>
                <div className="col-span-2 text-right">
                  <div className="font-semibold text-blue-600 dark:text-blue-400">
                    {entry.xp.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">XP</div>
                </div>
                <div className="col-span-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-semibold text-orange-600">
                      {entry.streak}
                    </span>
                    <span className="text-sm">🔥</span>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Current User Position (if not in top 50) */}
          {currentUserRank &&
            currentUserRank.rank > 50 &&
            !leaderboard.find((e) => e.user.id === currentUserId) && (
              <>
                <div className="text-center py-2 text-muted-foreground text-sm">
                  <TrendingUp className="h-4 w-4 inline mr-1" />
                  Tu posición
                </div>
                <div className="grid grid-cols-12 gap-4 px-4 py-3 rounded-lg items-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-500">
                  <div className="col-span-1">
                    <span className="text-sm font-bold text-blue-600">
                      #{currentUserRank.rank}
                    </span>
                  </div>
                  <div className="col-span-5 flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full ${getAvatarColor(
                        currentUserRank.user.id
                      )} flex items-center justify-center text-white font-semibold text-sm`}
                    >
                      {getInitials(
                        currentUserRank.user.name,
                        currentUserRank.user.email
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {currentUserRank.user.name ||
                          currentUserRank.user.email.split("@")[0]}
                      </div>
                      <Badge variant="secondary" className="text-xs mt-1">
                        <User className="h-3 w-3 mr-1" />
                        Tú
                      </Badge>
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <Badge variant="default">Nivel {currentUserRank.level}</Badge>
                  </div>
                  <div className="col-span-2 text-right">
                    <div className="font-semibold text-blue-600">
                      {currentUserRank.xp.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">XP</div>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-semibold text-orange-600">
                        {currentUserRank.streak}
                      </span>
                      <span className="text-sm">🔥</span>
                    </div>
                  </div>
                </div>
              </>
            )}
        </div>

        {loading && (
          <div className="text-center py-8 text-muted-foreground">
            Cargando ranking...
          </div>
        )}

        {!loading && leaderboard.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay jugadores en el ranking aún
          </div>
        )}
      </CardContent>
    </Card>
  )
}
