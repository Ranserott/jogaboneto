import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ChevronLeft, CheckCircle2, Circle, Lock } from "lucide-react"

export default async function WorldPage({ params }: { params: { id: string } }) {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  const world = await prisma.world.findUnique({
    where: { id: params.id },
    include: {
      levels: {
        orderBy: { order: "asc" },
      },
      userWorldProgress: {
        where: { userId: session.user.id },
      },
    },
  })

  if (!world) {
    redirect("/dashboard")
  }

  const userProgress = await prisma.userProgress.findUnique({
    where: { userId: session.user.id },
  })

  const isUnlocked = (userProgress?.currentLevel || 1) >= world.requiredLevel

  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
        <Card className="max-w-md p-8 text-center">
          <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <CardHeader>
            <CardTitle className="text-2xl">Mundo Bloqueado</CardTitle>
            <CardDescription>
              Necesitas alcanzar el nivel {world.requiredLevel} para desbloquear este mundo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard">Volver al Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const completedLevels = world.userWorldProgress?.[0]?.levelsCompleted || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <header className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-4 flex-1">
            <div className="text-4xl">{world.icon}</div>
            <div>
              <h1 className="text-2xl font-bold">{world.name}</h1>
              <p className="text-muted-foreground">{world.description}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-lg">
            {completedLevels}/{world.totalLevels} Niveles
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="bg-white/50 dark:bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-4">Conceptos Aprendidos</h2>
            <div className="flex flex-wrap gap-2">
              {world.levels.flatMap((level) => level.concepts).filter((concept, index, self) => 
                self.indexOf(concept) === index
              ).map((concept) => (
                <Badge key={concept} variant="secondary">
                  {concept}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <h2 className="text-2xl font-bold">Niveles</h2>
            {world.levels.map((level, index) => {
              const isUnlocked = completedLevels >= index
              const isCompleted = completedLevels > index

              return (
                <Card
                  key={level.id}
                  className={`transition-all hover:shadow-lg ${
                    !isUnlocked
                      ? "opacity-50 grayscale"
                      : isCompleted
                      ? "border-green-500 dark:border-green-600"
                      : "border-card hover:border-primary"
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {isCompleted ? (
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                          ) : (
                            <Circle className="h-6 w-6 text-muted-foreground" />
                          )}
                          <CardTitle className="text-xl">
                            Nivel {level.order + 1}: {level.name}
                          </CardTitle>
                        </div>
                        <Badge
                          variant={
                            level.difficulty === "beginner"
                              ? "default"
                              : level.difficulty === "intermediate"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {level.difficulty}
                        </Badge>
                      </div>
                      {!isUnlocked && <Lock className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <CardDescription className="mt-2">
                      {level.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Desafíos</span>
                        <span className="font-medium">
                          {level.totalChallenges} desafíos
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Puntos por desafío</span>
                        <span className="font-medium">
                          {level.pointsPerChallenge} puntos
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">XP por desafío</span>
                        <span className="font-medium">
                          {level.xpPerChallenge} XP
                        </span>
                      </div>

                      {!isUnlocked ? (
                        <Button variant="outline" className="w-full" disabled>
                          🔒 Bloqueado
                        </Button>
                      ) : (
                        <Button asChild className="w-full">
                          <Link href={`/levels/${level.id}`}>
                            {isCompleted ? "Repetir Nivel" : "Comenzar Nivel"}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
