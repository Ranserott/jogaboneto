"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Star, Target, CheckCircle2, XCircle, Flame } from "lucide-react"
import Link from "next/link"

interface DailyChallenge {
  id: string
  date: string
  bonusXP: number
  completions: number
  challenge: {
    id: string
    title: string
    description: string
    type: string
    points: number
    xp: number
    level: {
      name: string
      world: {
        name: string
        icon: string
      }
    }
  }
  userCompleted: boolean
  timeUntilNext: {
    hours: number
    minutes: number
    total: number
  }
}

interface DailyChallengeCardProps {
  userId?: string
}

export function DailyChallengeCard({ userId }: DailyChallengeCardProps) {
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number }>({
    hours: 0,
    minutes: 0,
  })

  useEffect(() => {
    fetchDailyChallenge()

    // Update countdown every minute
    const interval = setInterval(() => {
      if (dailyChallenge && !dailyChallenge.userCompleted) {
        updateTimeLeft()
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [dailyChallenge])

  const fetchDailyChallenge = async () => {
    try {
      const response = await fetch("/api/daily-challenge?action=current")
      const result = await response.json()

      if (result.success) {
        setDailyChallenge(result.data)
        setTimeLeft({
          hours: result.data.timeUntilNext.hours,
          minutes: result.data.timeUntilNext.minutes,
        })
      }
    } catch (error) {
      console.error("Error fetching daily challenge:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateTimeLeft = () => {
    if (!dailyChallenge) return

    const total = dailyChallenge.timeUntilNext.total - 60000 // Subtract 1 minute
    const hours = Math.floor(total / (1000 * 60 * 60))
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60))

    setTimeLeft({ hours, minutes })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Desafío Diario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Cargando desafío...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!dailyChallenge) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Desafío Diario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No hay desafío disponible en este momento
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`transition-all hover:shadow-lg ${
      dailyChallenge.userCompleted
        ? "border-green-500 bg-green-50/50 dark:bg-green-900/10"
        : "border-yellow-500 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10"
    }`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Desafío Diario
              {dailyChallenge.userCompleted ? (
                <Badge variant="default" className="ml-2 bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completado
                </Badge>
              ) : (
                <Badge variant="outline" className="ml-2">
                  <Target className="h-3 w-3 mr-1" />
                  Activo
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {dailyChallenge.userCompleted
                ? "¡Has completado el desafío de hoy! Vuelve mañana para el próximo."
                : "Completa este desafío para ganar XP bonus"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Challenge Info */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg mb-1">
              {dailyChallenge.challenge.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {dailyChallenge.challenge.description}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">
              {dailyChallenge.challenge.level.world.icon} {dailyChallenge.challenge.level.world.name}
            </Badge>
            <Badge variant="secondary">
              {dailyChallenge.challenge.level.name}
            </Badge>
            <Badge variant="secondary">
              {dailyChallenge.challenge.type === "code" ? "💻 Código" : "❓ Quiz"}
            </Badge>
          </div>
        </div>

        {/* Rewards */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-background/50 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-600">
              <Star className="h-4 w-4" />
              <span className="font-bold text-lg">{dailyChallenge.challenge.xp}</span>
            </div>
            <div className="text-xs text-muted-foreground">XP Base</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-orange-600">
              <Flame className="h-4 w-4" />
              <span className="font-bold text-lg">+{dailyChallenge.bonusXP}</span>
            </div>
            <div className="text-xs text-muted-foreground">Bonus Diario</div>
          </div>
        </div>

        {/* Countdown */}
        {!dailyChallenge.userCompleted && (
          <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">
              Termina en: {timeLeft.hours}h {timeLeft.minutes}m
            </span>
          </div>
        )}

        {/* Completions */}
        <div className="text-center text-sm text-muted-foreground">
          {dailyChallenge.completions} {dailyChallenge.completions === 1 ? "jugador" : "jugadores"} han completado este desafío
        </div>

        {/* Action Button */}
        <div className="flex gap-2">
          {dailyChallenge.userCompleted ? (
            <Button disabled className="flex-1">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Ya completado
            </Button>
          ) : (
            <Button asChild className="flex-1">
              <Link href={`/challenges/${dailyChallenge.challenge.id}?daily=${dailyChallenge.id}`}>
                <Target className="h-4 w-4 mr-2" />
                Desafío Diario
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/leaderboard">
              Ver Ranking
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
