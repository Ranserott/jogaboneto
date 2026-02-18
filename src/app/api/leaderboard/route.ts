import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
    const limit = parseInt(searchParams.get("limit") || "50")
    const period = searchParams.get("period") || "all" // all, week, month
    const userId = searchParams.get("userId")

    // Calculate date filter based on period
    let dateFilter: Date | undefined
    const now = new Date()

    if (period === "week") {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (period === "month") {
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Update leaderboard ranks
    await updateLeaderboardRanks()

    if (userId === "me") {
      // Get current user's position
      const userEntry = await prisma.leaderboard.findUnique({
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

      if (!userEntry) {
        // Create leaderboard entry for user
        const userProgress = await prisma.userProgress.findUnique({
          where: { userId: session.user.id },
        })

        if (userProgress) {
          const totalPlayers = await prisma.leaderboard.count()
          const newEntry = await prisma.leaderboard.create({
            data: {
              userId: session.user.id,
              rank: totalPlayers + 1,
              xp: userProgress.totalXP,
              points: userProgress.totalPoints,
              level: userProgress.currentLevel,
              streak: userProgress.currentStreak,
            },
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
          return NextResponse.json({ success: true, data: newEntry })
        }
      }

      // Get surrounding players (2 above, 2 below)
      const surroundingPlayers = await prisma.leaderboard.findMany({
        where: {
          rank: {
            gte: Math.max(1, (userEntry?.rank || 1) - 2),
            lte: (userEntry?.rank || 1) + 2,
          },
        },
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

      return NextResponse.json({
        success: true,
        data: userEntry,
        surroundingPlayers,
      })
    }

    // Get top players
    const leaderboard = await prisma.leaderboard.findMany({
      take: limit,
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

    // Get total players count
    const totalPlayers = await prisma.leaderboard.count()

    return NextResponse.json({
      success: true,
      data: leaderboard,
      totalPlayers,
    })
  } catch (error) {
    console.error("Leaderboard fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener el ranking" },
      { status: 500 }
    )
  }
}

async function updateLeaderboardRanks() {
  // Get all users with their progress, ordered by XP (descending)
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

  // Update ranks
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
}
