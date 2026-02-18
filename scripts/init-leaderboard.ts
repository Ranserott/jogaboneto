/**
 * Script para inicializar el leaderboard con usuarios existentes
 * Ejecutar después de hacer db:push y db:seed
 *
 * Uso:
 * npx tsx scripts/init-leaderboard.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🏆 Inicializando Leaderboard...')

  // Get all users with progress
  const allUsers = await prisma.user.findMany({
    include: {
      userProgress: true,
    },
  })

  console.log(`📊 Found ${allUsers.length} users`)

  // Filter users with progress and sort by XP
  const usersWithProgress = allUsers
    .filter((u) => u.userProgress.length > 0)
    .sort((a, b) => {
      const aProgress = a.userProgress[0]
      const bProgress = b.userProgress[0]

      // Sort by XP (primary), then by points (secondary), then by level
      if (bProgress.totalXP !== aProgress.totalXP) {
        return bProgress.totalXP - aProgress.totalXP
      }
      if (bProgress.totalPoints !== aProgress.totalPoints) {
        return bProgress.totalPoints - aProgress.totalPoints
      }
      return bProgress.currentLevel - aProgress.currentLevel
    })

  console.log(`📈 ${usersWithProgress.length} users with progress`)

  // Create or update leaderboard entries
  let created = 0
  let updated = 0

  for (let i = 0; i < usersWithProgress.length; i++) {
    const user = usersWithProgress[i]
    const progress = user.userProgress[0]
    const rank = i + 1

    const existing = await prisma.leaderboard.findUnique({
      where: { userId: user.id },
    })

    if (existing) {
      // Update existing entry
      await prisma.leaderboard.update({
        where: { userId: user.id },
        data: {
          rank,
          xp: progress.totalXP,
          points: progress.totalPoints,
          level: progress.currentLevel,
          streak: progress.currentStreak,
        },
      })
      updated++
    } else {
      // Create new entry
      await prisma.leaderboard.create({
        data: {
          userId: user.id,
          rank,
          xp: progress.totalXP,
          points: progress.totalPoints,
          level: progress.currentLevel,
          streak: progress.currentStreak,
        },
      })
      created++
    }

    console.log(
      `  ${rank}. ${user.name || user.email} - Nivel ${progress.currentLevel}, ${progress.totalXP} XP`
    )
  }

  console.log('\n✅ Leaderboard inicializado!')
  console.log(`   📝 Creados: ${created}`)
  console.log(`   🔄 Actualizados: ${updated}`)
  console.log(`   📊 Total: ${usersWithProgress.length} jugadores`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
