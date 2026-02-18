import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateLeaderboardForUser } from "@/lib/leaderboard"
import { z } from "zod"

const submitDailySchema = z.object({
  dailyChallengeId: z.string().cuid(),
  solution: z.string(),
  timeSpent: z.number().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { dailyChallengeId, solution, timeSpent = 0 } = submitDailySchema.parse(body)

    // Get the daily challenge
    const dailyChallenge = await prisma.dailyChallenge.findUnique({
      where: { id: dailyChallengeId },
      include: {
        challenge: true,
      },
    })

    if (!dailyChallenge) {
      return NextResponse.json(
        { success: false, error: "Desafío diario no encontrado" },
        { status: 404 }
      )
    }

    // Check if already completed
    const existingAttempt = await prisma.dailyAttempt.findUnique({
      where: {
        dailyChallengeId_userId: {
          dailyChallengeId,
          userId: session.user.id,
        },
      },
    })

    if (existingAttempt) {
      return NextResponse.json({
        success: false,
        error: "Ya has completado este desafío diario",
        alreadyCompleted: true,
      })
    }

    // Evaluate the solution
    const result = evaluateSolution(solution, dailyChallenge.challenge)

    if (result.success) {
      // Create daily attempt record
      await prisma.dailyAttempt.create({
        data: {
          dailyChallengeId,
          userId: session.user.id,
          bonusEarned: true,
          timeSpent,
        },
      })

      // Update daily challenge completions
      await prisma.dailyChallenge.update({
        where: { id: dailyChallengeId },
        data: { completions: { increment: 1 } },
      })

      // Award bonus XP
      const totalXP = dailyChallenge.challenge.xp + dailyChallenge.bonusXP

      await prisma.userProgress.update({
        where: { userId: session.user.id },
        data: {
          totalXP: { increment: totalXP },
          totalPoints: { increment: dailyChallenge.challenge.points },
          challengesSolved: { increment: 1 },
          currentStreak: { increment: 1 },
        },
      })

      // Create challenge attempt record
      await prisma.challengeAttempt.create({
        data: {
          userId: session.user.id,
          challengeId: dailyChallenge.challengeId,
          isPassed: true,
          isCorrect: true,
          solution: solution,
          pointsEarned: dailyChallenge.challenge.points,
          xpEarned: totalXP,
          timeSpent,
          feedback: `¡Desafío diario completado! +${totalXP} XP (+${dailyChallenge.bonusXP} bonus)`,
        },
      })

      // Update leaderboard
      await updateLeaderboardForUser(session.user.id)

      return NextResponse.json({
        success: true,
        message: result.message,
        bonusXP: dailyChallenge.bonusXP,
        totalXP,
        pointsEarned: dailyChallenge.challenge.points,
      })
    }

    return NextResponse.json({
      success: false,
      error: result.message,
    })
  } catch (error) {
    console.error("Daily challenge submit error:", error)
    return NextResponse.json(
      { success: false, error: "Error al procesar el desafío diario" },
      { status: 500 }
    )
  }
}

function evaluateSolution(solution: string, challenge: any): {
  success: boolean
  message: string
} {
  if (challenge.type === "code") {
    // For code challenges, do basic validation
    if (challenge.expectedSolution) {
      const isCorrect = solution.trim().toLowerCase() ===
        challenge.expectedSolution.trim().toLowerCase()

      return {
        success: isCorrect,
        message: isCorrect
          ? "¡Código correcto!"
          : "Tu código no coincide con la solución esperada. Inténtalo de nuevo.",
      }
    }

    // Basic syntax check
    try {
      new Function(solution)
      return {
        success: true,
        message: "¡Código válido!",
      }
    } catch {
      return {
        success: false,
        message: "Error de sintaxis en tu código.",
      }
    }
  }

  if (challenge.type === "quiz") {
    const isCorrect = solution.trim().toLowerCase() ===
      challenge.correctAnswer?.toLowerCase()

    return {
      success: isCorrect,
      message: isCorrect
        ? "¡Respuesta correcta!"
        : "Respuesta incorrecta. Inténtalo de nuevo.",
    }
  }

  return {
    success: false,
    message: "Tipo de desafío no soportado",
  }
}
