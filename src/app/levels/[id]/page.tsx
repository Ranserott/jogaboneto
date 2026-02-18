import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { LevelContent } from "@/components/levels/LevelContent"

export default async function LevelPage({ params }: { params: { id: string } }) {
  const session = await auth()

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
