import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy } from "lucide-react"

export default async function LeaderboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  // Get initial leaderboard data
  const leaderboard = await prisma.leaderboard.findMany({
    take: 50,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { rank: "asc" },
  })

  // Get current user's position
  const currentUserRank = await prisma.leaderboard.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <header className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Link>
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              <Trophy className="h-6 w-6 inline mr-2 text-yellow-500" />
              Ranking Global
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session.user.name || session.user.email}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-2">
              Los Mejores Jugadores de JogaBoneto
            </h2>
            <p className="text-muted-foreground">
              Compite con otros jugadores y sube en el ranking completando desafíos
            </p>
            {currentUserRank && (
              <div className="mt-4 inline-block">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg">
                  <span className="text-sm opacity-90">Tu posición actual</span>
                  <div className="text-2xl font-bold">
                    #{currentUserRank.rank}
                  </div>
                </div>
              </div>
            )}
          </div>

          <LeaderboardTable
            currentUserId={session.user.id}
            initialData={leaderboard}
          />
        </div>
      </main>
    </div>
  )
}
