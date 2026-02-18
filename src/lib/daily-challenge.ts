import { prisma } from "@/lib/prisma"

/**
 * Obtiene o crea el desafío del día
 */
export async function getOrCreateDailyChallenge() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let dailyChallenge = await prisma.dailyChallenge.findUnique({
    where: { date: today },
    include: {
      challenge: {
        include: {
          level: {
            include: {
              world: true,
            },
          },
        },
      },
    },
  })

  if (!dailyChallenge) {
    dailyChallenge = await createDailyChallenge(today)
  }

  return dailyChallenge
}

/**
 * Crea un nuevo desafío diario para una fecha específica
 */
export async function createDailyChallenge(date: Date) {
  // Get all challenges excluding those used in the last 30 days
  const thirtyDaysAgo = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000)

  const usedChallengeIds = await prisma.dailyChallenge.findMany({
    where: {
      date: {
        gte: thirtyDaysAgo,
      },
    },
    select: { challengeId: true },
  })

  const availableChallenges = await prisma.challenge.findMany({
    where: {
      id: {
        notIn: usedChallengeIds.map((dc) => dc.challengeId),
      },
    },
    include: {
      level: {
        include: {
          world: true,
        },
      },
    },
  })

  if (availableChallenges.length === 0) {
    // Fallback: pick a random challenge from all challenges
    const allChallenges = await prisma.challenge.findMany({
      include: {
        level: {
          include: {
            world: true,
          },
        },
      },
      take: 1,
    })

    if (allChallenges.length === 0) {
      throw new Error("No hay desafíos disponibles en la base de datos")
    }

    const selectedChallenge = allChallenges[0]

    return prisma.dailyChallenge.create({
      data: {
        date,
        challengeId: selectedChallenge.id,
        bonusXP: 50,
      },
      include: {
        challenge: {
          include: {
            level: {
              include: {
                world: true,
              },
            },
          },
        },
      },
    })
  }

  // Pick a random challenge
  const randomIndex = Math.floor(Math.random() * availableChallenges.length)
  const selectedChallenge = availableChallenges[randomIndex]

  return prisma.dailyChallenge.create({
    data: {
      date,
      challengeId: selectedChallenge.id,
      bonusXP: 50,
    },
    include: {
      challenge: {
        include: {
          level: {
            include: {
              world: true,
            },
          },
        },
      },
    },
  })
}

/**
 * Verifica si un usuario ha completado el desafío del día
 */
export async function hasUserCompletedDailyChallenge(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dailyChallenge = await prisma.dailyChallenge.findUnique({
    where: { date: today },
  })

  if (!dailyChallenge) {
    return { completed: false, dailyChallengeId: null }
  }

  const attempt = await prisma.dailyAttempt.findUnique({
    where: {
      dailyChallengeId_userId: {
        dailyChallengeId: dailyChallenge.id,
        userId,
      },
    },
  })

  return {
    completed: !!attempt,
    dailyChallengeId: dailyChallenge.id,
    attempt,
  }
}

/**
 * Obtiene estadísticas del desafío diario
 */
export async function getDailyChallengeStats(dailyChallengeId: string) {
  const stats = await prisma.dailyAttempt.groupBy({
    by: ['bonusEarned'],
    where: {
      dailyChallengeId,
    },
    _count: true,
  })

  const totalAttempts = await prisma.dailyAttempt.count({
    where: {
      dailyChallengeId,
    },
  })

  const avgTimeSpent = await prisma.dailyAttempt.aggregate({
    where: {
      dailyChallengeId,
    },
    _avg: {
      timeSpent: true,
    },
  })

  return {
    totalAttempts,
    successfulAttempts: stats.find((s) => s.bonusEarned)?._count || 0,
    avgTimeSpent: avgTimeSpent._avg.timeSpent || 0,
  }
}
