import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password } = registerSchema.parse(body)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      )
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password, // In production, hash with bcrypt
        userProgress: {
          create: {
            totalPoints: 0,
            currentLevel: 1,
            totalXP: 0,
            currentStreak: 1,
            maxStreak: 1,
            worldsCompleted: 0,
            challengesSolved: 0,
          },
        },
      },
    })

    // Create level history
    await prisma.levelHistory.create({
      data: {
        userId: user.id,
        level: 1,
        totalXP: 0,
        xpGained: 0,
        unlockedBadges: [],
      },
    })

    // Unlock first world
    const firstWorld = await prisma.world.findFirst({
      where: { order: 1 },
    })

    if (firstWorld) {
      await prisma.userWorldProgress.create({
        data: {
          userId: user.id,
          worldId: firstWorld.id,
          isUnlocked: true,
          unlockedAt: new Date(),
        },
      })
    }

    return NextResponse.json(
      {
        message: "Usuario registrado exitosamente",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Error al registrar usuario" },
      { status: 500 }
    )
  }
}
