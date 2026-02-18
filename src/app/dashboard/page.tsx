import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DailyChallengeCard } from "@/components/dashboard/DailyChallengeCard"
import Link from "next/link"
import { BookOpen, Target, Trophy, Zap } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  const userProgress = await prisma.userProgress.findUnique({
    where: { userId: session.user.id },
  })

  const worlds = await prisma.world.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: { levels: true },
      },
    },
  })

  const userBadges = await prisma.userBadge.findMany({
    where: { userId: session.user.id },
    include: {
      badge: true,
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <header className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            JogaBoneto
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/leaderboard">
                <Trophy className="h-4 w-4 mr-2" />
                Ranking
              </Link>
            </Button>
            <span className="text-sm text-muted-foreground">
              Hola, {session.user.name || session.user.email}
            </span>
            <Button variant="outline" size="sm" asChild>
              <Link href="/api/auth/signout">Cerrar Sesión</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Daily Challenge Card */}
          <DailyChallengeCard userId={session.user.id} />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Puntos Totales
                </CardTitle>
                <Trophy className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userProgress?.totalPoints || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Nivel Actual
                </CardTitle>
                <Zap className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userProgress?.currentLevel || 1}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  XP Total
                </CardTitle>
                <Target className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userProgress?.totalXP || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Racha Actual
                </CardTitle>
                <Zap className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userProgress?.currentStreak || 0} 🔥
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Badges Section */}
          <Card>
            <CardHeader>
              <CardTitle>Insignias Obtenidas</CardTitle>
              <CardDescription>
                {userBadges.length} insignias coleccionadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userBadges.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Completa mundos para ganar insignias
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {userBadges.map((userBadge) => (
                    <div
                      key={userBadge.id}
                      className="flex flex-col items-center p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="text-4xl mb-2">{userBadge.badge.icon}</div>
                      <div className="text-center">
                        <div className="font-semibold text-sm">
                          {userBadge.badge.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {userBadge.badge.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Worlds Section */}
          <div>
            <h2 className="text-3xl font-bold mb-6">Mundos Educativos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {worlds.map((world, index) => {
                const isLocked = (userProgress?.currentLevel || 1) < world.requiredLevel

                return (
                  <Card
                    key={world.id}
                    className={`transition-all hover:shadow-lg ${
                      isLocked
                        ? "opacity-50 grayscale"
                        : "cursor-pointer hover:scale-105"
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="text-4xl">{world.icon}</div>
                        {isLocked && (
                          <div className="text-2xl">🔒</div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <CardTitle className="text-xl">
                          {world.name}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {world.description}
                        </CardDescription>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Nivel requerido</span>
                          <span className="font-medium">{world.requiredLevel}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Niveles totales</span>
                          <span className="font-medium">{world.totalLevels}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Retos totales</span>
                          <span className="font-medium">{world.totalChallenges}</span>
                        </div>
                      </div>

                      {isLocked ? (
                        <Button
                          variant="outline"
                          className="w-full"
                          disabled
                        >
                          🔒 Bloqueado
                        </Button>
                      ) : (
                        <Button
                          asChild
                          className="w-full"
                        >
                          <Link href={`/worlds/${world.id}`}>
                            Explorar Mundo
                          </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
