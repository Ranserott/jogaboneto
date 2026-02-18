import { prisma } from "@/lib/prisma"

/**
 * Updates the leaderboard after a user gains XP or completes a challenge
 * This ensures the leaderboard reflects the latest rankings
 */
export async function updateLeaderboardForUser(userId: string) {
  // Get the user's current progress
  const userProgress = await prisma.userProgress.findUnique({
    where: { userId },
  })

  if (!userProgress) {
    return
  }

  // Get all users ordered by XP (for ranking)
  const allUsers = await prisma.userProgress.findMany({
    select: {
      userId: true,
      totalXP: true,
      totalPoints: true,
      currentLevel: true,
      currentStreak: true,
    },
  })

  // Sort by XP (primary), then by points (secondary), then by level
  const sortedUsers = allUsers.sort((a, b) => {
    if (b.totalXP !== a.totalXP) return b.totalXP - a.totalXP
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
    return b.currentLevel - a.currentLevel
  })

  // Find the user's rank
  const userRank = sortedUsers.findIndex((u) => u.userId === userId) + 1

  // Update or create the leaderboard entry for this user
  await prisma.leaderboard.upsert({
    where: { userId },
    update: {
      rank: userRank,
      xp: userProgress.totalXP,
      points: userProgress.totalPoints,
      level: userProgress.currentLevel,
      streak: userProgress.currentStreak,
    },
    create: {
      userId,
      rank: userRank,
      xp: userProgress.totalXP,
      points: userProgress.totalPoints,
      level: userProgress.currentLevel,
      streak: userProgress.currentStreak,
    },
  })

  // Update ranks for users affected by the change
  // This is a simplified approach - in production, you might want to use a job queue
  const usersToUpdate = sortedUsers.slice(Math.max(0, userRank - 5), userRank + 5)

  for (let i = 0; i < usersToUpdate.length; i++) {
    const u = usersToUpdate[i]
    const rank = sortedUsers.findIndex((su) => su.userId === u.userId) + 1

    await prisma.leaderboard.upsert({
      where: { userId: u.userId },
      update: {
        rank,
        xp: u.totalXP,
        points: u.totalPoints,
        level: u.currentLevel,
        streak: u.currentStreak,
      },
      create: {
        userId: u.userId,
        rank,
        xp: u.totalXP,
        points: u.totalPoints,
        level: u.currentLevel,
        streak: u.currentStreak,
      },
    })
  }
}

/**
 * Refreshes the entire leaderboard
 * Use this periodically or when significant changes occur
 */
export async function refreshLeaderboard() {
  const allUsers = await prisma.userProgress.findMany({
    include: {
      user: {
        select: { id: true },
      },
    },
  })

  // Sort by XP (primary), then by points (secondary), then by level
  const sortedUsers = allUsers.sort((a, b) => {
    if (b.totalXP !== a.totalXP) return b.totalXP - a.totalXP
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
    return b.currentLevel - a.currentLevel
  })

  // Update all ranks
  for (let i = 0; i < sortedUsers.length; i++) {
    const userProgress = sortedUsers[i]
    const rank = i + 1

    await prisma.leaderboard.upsert({
      where: { userId: userProgress.userId },
      update: {
        rank,
        xp: userProgress.totalXP,
        points: userProgress.totalPoints,
        level: userProgress.currentLevel,
        streak: userProgress.currentStreak,
      },
      create: {
        userId: userProgress.userId,
        rank,
        xp: userProgress.totalXP,
        points: userProgress.totalPoints,
        level: userProgress.currentLevel,
        streak: userProgress.currentStreak,
      },
    })
  }

  return sortedUsers.length
}
