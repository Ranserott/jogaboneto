import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <div className="text-center space-y-8 p-8 max-w-4xl">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            JogaBoneto
          </h1>
          <p className="text-2xl text-muted-foreground">
            Aprende JavaScript mientras te diviertes
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Recorre 9 mundos educativos, completa desafíos y gana insignias mientras dominas JavaScript desde lo básico hasta lo avanzado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card text-card-foreground rounded-lg p-6 border shadow-lg">
            <div className="text-4xl mb-4">🌍</div>
            <h3 className="text-xl font-semibold mb-2">9 Mundos Educativos</h3>
            <p className="text-sm text-muted-foreground">
              Variables, funciones, objetos, arrays, DOM, async/await, ES6+, y más
            </p>
          </div>

          <div className="bg-card text-card-foreground rounded-lg p-6 border shadow-lg">
            <div className="text-4xl mb-4">🎮</div>
            <h3 className="text-xl font-semibold mb-2">Sistema de Logros</h3>
            <p className="text-sm text-muted-foreground">
              Gana puntos, insignias y sube de nivel mientras avanzas
            </p>
          </div>

          <div className="bg-card text-card-foreground rounded-lg p-6 border shadow-lg">
            <div className="text-4xl mb-4">💻</div>
            <h3 className="text-xl font-semibold mb-2">Ejercicios Prácticos</h3>
            <p className="text-sm text-muted-foreground">
              Resuelve desafíos reales y ve los resultados instantáneamente
            </p>
          </div>
        </div>

        <div className="flex gap-4 justify-center pt-8">
          <Link href="/auth/login">
            <Button size="lg" className="text-lg">
              Comenzar Aventura
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="text-lg">
              Ver Demo
            </Button>
          </Link>
        </div>

        <div className="pt-8 text-sm text-muted-foreground">
          <p>Built with Next.js 15, TypeScript, Tailwind CSS & Prisma</p>
        </div>
      </div>
    </div>
  )
}
