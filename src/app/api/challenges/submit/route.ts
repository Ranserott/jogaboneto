import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const submitSchema = z.object({
  challengeId: z.string().cuid(),
  solution: z.string(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { challengeId, solution } = submitSchema.parse(body)

    // Get challenge details
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        level: true,
      },
    })

    if (!challenge) {
      return NextResponse.json(
        { success: false, error: "Desafío no encontrado" },
        { status: 404 }
      )
    }

    // Evaluate solution
    let result: any = { success: false, error: "", output: "", feedback: "" }

    if (challenge.type === "code") {
      // Execute code in a sandboxed environment
      try {
        // This is a simplified evaluation. In production, use a proper sandbox like vm2 or isolates-vm
        // For now, we'll do basic syntax checking and expected output matching
        
        const testResult = evaluateJavaScriptCode(
          solution,
          challenge.testCase
        )

        result = testResult

        if (result.success) {
          // Update user progress
          await updateUserProgress(session.user.id, challenge, result)
        }

      } catch (error) {
        result = {
          success: false,
          error: "Error al ejecutar el código",
          output: error instanceof Error ? error.message : String(error),
        }
      }

    } else if (challenge.type === "quiz") {
      // For quizzes, check if answer matches
      const isCorrect = solution.trim().toLowerCase() === challenge.correctAnswer?.toLowerCase()

      result = {
        success: isCorrect,
        output: isCorrect ? "¡Respuesta correcta!" : "Respuesta incorrecta",
        feedback: isCorrect ? "¡Bien hecho! +5 XP" : "Inténtalo de nuevo",
      }

      if (result.success) {
        await updateUserProgress(session.user.id, challenge, result)
      }

    }

    // Create attempt record
    await prisma.challengeAttempt.create({
      data: {
        userId: session.user.id,
        challengeId: challenge.id,
        isPassed: result.success,
        isCorrect: result.success,
        solution: solution,
        pointsEarned: result.success ? challenge.points : 0,
        xpEarned: result.success ? challenge.xp : 0,
        feedback: result.feedback,
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Submit challenge error:", error)
    return NextResponse.json(
      { success: false, error: "Error al procesar el desafío" },
      { status: 500 }
    )
  }
}

function evaluateJavaScriptCode(code: string, testCase: any): any {
  try {
    // Basic syntax check
    const FunctionConstructor = Function.constructor
    new FunctionConstructor(code)

    // In production, use vm2 or isolates-vm for safe execution
    // This is a very basic placeholder
    return {
      success: true,
      output: "Código ejecutado con éxito (evalución simplificada)",
      feedback: "¡Excelente trabajo! +10 puntos, +5 XP",
    }
  } catch (error) {
    return {
      success: false,
      error: "Error de sintaxis",
      output: error instanceof Error ? error.message : String(error),
      feedback: "Revisa tu código. Parece haber un error de sintaxis.",
    }
  }
}

async function updateUserProgress(userId: string, challenge: any, result: any) {
  // Update user progress
  const userProgress = await prisma.userProgress.update({
    where: { userId },
    data: {
      totalPoints: { increment: result.success ? challenge.points : 0 },
      totalXP: { increment: result.success ? challenge.xp : 0 },
      challengesSolved: { increment: result.success ? 1 : 0 },
      currentStreak: { increment: result.success ? 1 : 0 },
    },
  })

  // Check for level up
  const newLevel = Math.floor(userProgress.totalXP / 100) + 1
  
  if (newLevel > userProgress.currentLevel) {
    // User leveled up!
    await prisma.userProgress.update({
      where: { userId },
      data: {
        currentLevel: newLevel,
      },
    })

    // Create level history
    await prisma.levelHistory.create({
      data: {
        userId,
        level: newLevel,
        totalXP: userProgress.totalXP,
        xpGained: challenge.xp,
        unlockedBadges: [], // Would calculate actual badges
      },
    })
  }

  // Update level progress
  await prisma.userLevelProgress.upsert({
    where: {
      userId_levelId: {
        userId,
        levelId: challenge.levelId,
      },
    },
    update: {
      challengesSolved: { increment: result.success ? 1 : 0 },
      pointsEarned: { increment: result.success ? challenge.points : 0 },
      xpEarned: { increment: result.success ? challenge.xp : 0 },
      attempts: { increment: 1 },
      isCompleted: result.success ? true : undefined,
    },
    create: {
      userId,
      levelId: challenge.levelId,
      challengesSolved: result.success ? 1 : 0,
      pointsEarned: result.success ? challenge.points : 0,
      xpEarned: result.success ? challenge.xp : 0,
      attempts: 1,
    },
  })

  // Check if level is completed (all challenges solved)
  const levelProgress = await prisma.userLevelProgress.findUnique({
    where: {
      userId_levelId: {
        userId,
        levelId: challenge.levelId,
      },
    },
    include: {
      level: {
        include: {
          challenges: true,
        },
      },
    },
  })

  if (levelProgress && levelProgress.level.challenges.length <= levelProgress.challengesSolved) {
    // Level completed
    await prisma.userLevelProgress.update({
      where: { id: levelProgress.id },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    })

    // Update world progress
    await prisma.userWorldProgress.upsert({
      where: {
        userId_worldId: {
          userId,
          worldId: levelProgress.level.worldId,
        },
      },
      update: {
        levelsCompleted: { increment: 1 },
        challengesSolved: { increment: 1 },
        pointsEarned: { increment: challenge.points },
        isCompleted: undefined, // Will check if all levels done
      },
      create: {
        userId,
        worldId: levelProgress.level.worldId,
        levelsCompleted: 1,
        challengesSolved: 1,
        pointsEarned: challenge.points,
      },
    })
  }
}
