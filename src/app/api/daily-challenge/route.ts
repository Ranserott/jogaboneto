import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getOrCreateDailyChallenge } from "@/lib/daily-challenge"

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    if (action === "current") {
      // Get today's daily challenge
      const dailyChallenge = await getOrCreateDailyChallenge()

      // Check if user has completed it
      const { prisma } = await import("@/lib/prisma")
      const userAttempt = await prisma.dailyAttempt.findUnique({
        where: {
          dailyChallengeId_userId: {
            dailyChallengeId: dailyChallenge.id,
            userId: session.user.id,
          },
        },
      })

      // Calculate time until next challenge
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const timeUntilNext = tomorrow.getTime() - Date.now()
      const hoursUntilNext = Math.floor(timeUntilNext / (1000 * 60 * 60))
      const minutesUntilNext = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60))

      return NextResponse.json({
        success: true,
        data: {
          ...dailyChallenge,
          userCompleted: !!userAttempt,
          userAttempt,
          timeUntilNext: {
            hours: hoursUntilNext,
            minutes: minutesUntilNext,
            total: timeUntilNext,
          },
        },
      })
    }

    return NextResponse.json(
      { success: false, error: "Acción no válida" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Daily challenge fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener el desafío diario" },
      { status: 500 }
    )
  }
}
