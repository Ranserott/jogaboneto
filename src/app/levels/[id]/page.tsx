import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, BookOpen, CheckCircle2, RotateCw, XCircle } from "lucide-react"
import { useState } from "react"

export default async function LevelPage({ params }: { params: { id: string } }) {
  const session = await getServerSession()

  if (!session?.user) {
    redirect("/auth/login")
  }

  const level = await prisma.level.findUnique({
    where: { id: params.id },
    include: {
      world: true,
      challenges: {
        orderBy: { order: "asc" },
      },
      userLevelProgress: {
        where: { userId: session.user.id },
      },
    },
  })

  if (!level) {
    redirect("/dashboard")
  }

  const userProgress = await prisma.userProgress.findUnique({
    where: { userId: session.user.id },
  })

  const isCompleted = level.userLevelProgress?.[0]?.isCompleted || false

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <header className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/worlds/${level.worldId}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-4 flex-1">
            <div className="text-4xl">{level.world.icon}</div>
            <div>
              <h1 className="text-xl font-bold">
                {level.world.name} - Nivel {level.order + 1}
              </h1>
              <p className="text-sm text-muted-foreground">{level.name}</p>
            </div>
          </div>
          {isCompleted && (
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <LevelContent 
          level={level} 
          userId={session.user.id} 
          userProgress={userProgress} 
        />
      </main>
    </div>
  )
}

function LevelContent({ level, userId, userProgress }: { level: any, userId: string, userProgress: any }) {
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0)
  const [code, setCode] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [output, setOutput] = useState("")
  const [attempts, setAttempts] = useState(0)
  const [completedChallenges, setCompletedChallenges] = useState(new Set())

  const currentChallenge = level.challenges[currentChallengeIndex]
  const totalChallenges = level.challenges.length

  const handleRunCode = async () => {
    setIsRunning(true)
    setResult(null)
    setOutput("")

    try {
      const res = await fetch("/api/challenges/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: currentChallenge.id,
          solution: code,
        }),
      })

      const data = await res.json()
      
      setResult(data)
      setOutput(data.output || data.error || "Código ejecutado sin errores")
      
      if (data.success) {
        setCompletedChallenges(new Set([...completedChallenges, currentChallenge.id]))
      }
      
      setAttempts(attempts + 1)
    } catch (err) {
      setResult({ success: false, error: "Error al ejecutar el código" })
      setOutput("Error de conexión con el servidor")
    } finally {
      setIsRunning(false)
    }
  }

  const handleNextChallenge = () => {
    if (currentChallengeIndex < totalChallenges - 1) {
      setCurrentChallengeIndex(currentChallengeIndex + 1)
      setCode("")
      setResult(null)
      setOutput("")
    }
  }

  const handleResetCode = () => {
    setCode(currentChallenge.initialCode || "")
    setResult(null)
    setOutput("")
  }

  const progress = ((currentChallengeIndex + 1) / totalChallenges) * 100

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="font-medium">
                Desafío {currentChallengeIndex + 1} de {totalChallenges}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% completado
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Challenge Info */}
        <Card>
          <CardHeader>
            <CardTitle>{currentChallenge.title}</CardTitle>
            <CardDescription>{currentChallenge.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-semibold mb-2">Instrucciones:</h4>
              <p className="text-sm">{currentChallenge.instruction}</p>
            </div>

            {currentChallenge.initialCode && (
              <div>
                <h4 className="font-semibold mb-2">Código de inicio:</h4>
                <pre className="bg-muted rounded-lg p-4 text-sm overflow-x-auto">
                  <code>{currentChallenge.initialCode}</code>
                </pre>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Puntos:</span>
                <Badge variant="secondary">{currentChallenge.points}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">XP:</span>
                <Badge variant="secondary">{currentChallenge.xp}</Badge>
              </div>
            </div>

            {result && (
              <div
                className={`p-4 rounded-lg ${
                  result.success
                    ? "bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800"
                    : "bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-semibold">
                    {result.success ? "¡Correcto!" : "Intenta de nuevo"}
                  </span>
                </div>
                {result.feedback && (
                  <p className="text-sm mt-2">{result.feedback}</p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              {result?.success && currentChallengeIndex < totalChallenges - 1 ? (
                <Button onClick={handleNextChallenge} className="flex-1">
                  Siguiente Desafío →
                </Button>
              ) : (
                <Button onClick={handleRunCode} disabled={isRunning} className="flex-1">
                  {isRunning ? (
                    <>
                      <RotateCw className="h-4 w-4 animate-spin mr-2" />
                      Ejecutando...
                    </>
                  ) : (
                    "Ejecutar Código"
                  )}
                </Button>
              )}
              <Button onClick={handleResetCode} variant="outline">
                Reiniciar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Code Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Editor de Código</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-64 font-mono text-sm bg-muted rounded-lg p-4 border-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="// Escribe tu código JavaScript aquí..."
              spellCheck={false}
            />

            {output && (
              <div className="space-y-2">
                <h4 className="font-semibold">Salida:</h4>
                <pre className={`bg-muted rounded-lg p-4 text-sm overflow-x-auto ${
                  result?.success ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
                }`}>
                  <code>{output}</code>
                </pre>
              </div>
            )}

            <div className="text-center text-sm text-muted-foreground">
              Intentos: {attempts}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Completion */}
      {currentChallengeIndex === totalChallenges - 1 && result?.success && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600" />
            <h2 className="text-2xl font-bold mb-2 text-green-700 dark:text-green-300">
              ¡Nivel Completado!
            </h2>
            <p className="text-muted-foreground mb-4">
              Has completado todos los desafíos del nivel.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href={`/worlds/${level.worldId}`}>
                  Volver al Mundo
                </Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard">
                  Ir al Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
