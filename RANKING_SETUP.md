# Configuración del Ranking Global y Desafío Diario

Esta guía describe cómo configurar y utilizar las nuevas funcionalidades de Ranking Global y Desafío Diario en JogaBoneto.

## Características Implementadas

### 1. Ranking Global
- Tabla de líderes con los mejores jugadores
- Rankings por: Histórico, Semana, Mes
- Resaltado de la posición del usuario actual
- Avatares generados con colores únicos
- Mostrado de nivel, XP, puntos y racha

### 2. Desafío Diario
- Un desafío nuevo cada día
- Bonus de +50 XP por completarlo
- Countdown hasta el próximo desafío
- Seguimiento de completados
- Integración con el leaderboard

## Configuración de la Base de Datos

### Paso 1: Actualizar el Schema

El schema de Prisma ya ha sido actualizado con los siguientes modelos:

```prisma
model Leaderboard {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  rank      Int
  xp        Int
  points    Int
  level     Int
  streak    Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model DailyChallenge {
  id              String          @id @default(cuid())
  date            DateTime        @unique
  challengeId     String
  challenge       Challenge       @relation(fields: [challengeId], references: [id])
  completions     Int             @default(0)
  bonusXP         Int             @default(50)
  attempts        DailyAttempt[]
}

model DailyAttempt {
  id                String          @id @default(cuid())
  dailyChallengeId  String
  dailyChallenge    DailyChallenge  @relation(fields: [dailyChallengeId], references: [id], onDelete: Cascade)
  userId            String
  user              User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  completedAt       DateTime        @default(now())
  bonusEarned       Boolean         @default(false)
  timeSpent         Int
}
```

### Paso 2: Aplicar los Cambios

Ejecuta el siguiente comando para aplicar los cambios a la base de datos:

```bash
npm run db:push
```

### Paso 3: Ejecutar el Seed

El seed ha sido actualizado para incluir:
- 5 usuarios adicionales con diferentes niveles de progreso
- Inicialización del leaderboard con todos los usuarios
- Rankings basados en XP, puntos y nivel

```bash
npm run db:seed
```

## Rutas de la API

### Leaderboard

#### GET /api/leaderboard

Obtiene el ranking global.

**Parámetros:**
- `limit` (opcional): Número de jugadores a devolver (default: 50)
- `period` (opcional): Período de tiempo - "all", "week", "month" (default: "all")
- `userId` (opcional): "me" para obtener la posición del usuario actual

**Ejemplos:**

```bash
# Obtener top 50 histórico
GET /api/leaderboard?limit=50&period=all

# Obtener top 20 de la semana
GET /api/leaderboard?limit=20&period=week

# Obtener posición del usuario actual
GET /api/leaderboard?userId=me
```

### Desafío Diario

#### GET /api/daily-challenge

Obtiene el desafío del día.

**Parámetros:**
- `action`: "current" para obtener el desafío de hoy

**Ejemplo:**

```bash
GET /api/daily-challenge?action=current
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "id": "...",
    "date": "2026-02-18T00:00:00.000Z",
    "bonusXP": 50,
    "challenge": { ... },
    "userCompleted": false,
    "timeUntilNext": {
      "hours": 23,
      "minutes": 59
    }
  }
}
```

#### POST /api/daily-challenge/submit

Envía una solución para el desafío diario.

**Body:**

```json
{
  "dailyChallengeId": "...",
  "solution": "let nombre = 'JogaBoneto';",
  "timeSpent": 120
}
```

**Respuesta:**

```json
{
  "success": true,
  "message": "¡Código correcto!",
  "bonusXP": 50,
  "totalXP": 55,
  "pointsEarned": 10
}
```

## Componentes

### LeaderboardTable

Componente para mostrar la tabla de ranking.

**Uso:**

```tsx
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable"

<LeaderboardTable
  currentUserId={session.user.id}
  initialData={leaderboard}
/>
```

**Props:**
- `currentUserId`: ID del usuario actual (opcional)
- `initialData`: Datos iniciales del leaderboard
- `surroundingPlayers`: Jugadores cercanos al usuario (opcional)

### DailyChallengeCard

Componente para mostrar el desafío diario en el dashboard.

**Uso:**

```tsx
import { DailyChallengeCard } from "@/components/dashboard/DailyChallengeCard"

<DailyChallengeCard userId={session.user.id} />
```

**Props:**
- `userId`: ID del usuario actual (opcional)

## Páginas

### /leaderboard

Página dedicada al ranking global.

Incluye:
- Tabla completa de rankings
- Filtros por período
- Resaltado de posición del usuario
- Navegación de vuelta al dashboard

### /dashboard (actualizado)

El dashboard ahora incluye:
- Tarjeta de Desafío Diario al inicio
- Enlace al Ranking Global en el header
- Integración con ambas funcionalidades

## Funciones Helper

### updateLeaderboardForUser(userId: string)

Actualiza el ranking de un usuario específico y los jugadores cercanos.

Se llama automáticamente cuando:
- Un usuario completa un desafío
- Un usuario completa el desafío diario

```ts
import { updateLeaderboardForUser } from "@/lib/leaderboard"

await updateLeaderboardForUser(userId)
```

### refreshLeaderboard()

Refresca el ranking completo de todos los usuarios.

Útil para:
- Cron jobs
- Actualizaciones masivas
- Mantenimiento

```ts
import { refreshLeaderboard } from "@/lib/leaderboard"

const totalUsers = await refreshLeaderboard()
```

## Estilo Visual

### Colores de Ranking

- **Top 1**: Corona dorada 🏆
- **Top 2**: Medalla de plata 🥈
- **Top 3**: Medalla de bronce 🥉
- **Top 4-10**: Badge secundario
- **Resto**: Badge outline

### Usuario Actual

El usuario actual se resalta con:
- Borde azul graduado
- Fondo azul/púrpura claro
- Badge "Tú"
- Mayor visibilidad en la tabla

## Consideraciones de Performance

### Optimizaciones Implementadas

1. **Índices de Base de Datos**:
   - `@@index([xp])` en Leaderboard
   - `@@index([rank])` en Leaderboard
   - `@@index([date])` en DailyChallenge

2. **Actualización Selectiva**:
   - Solo se actualizan jugadores cercanos al usuario
   - El refresh completo se puede hacer periódicamente

3. **Caching en Cliente**:
   - Los datos iniciales se pasan como props
   - Solo se hace fetch cuando es necesario

## Próximos Pasos (Opcionales)

### 1. Cron Job para Desafío Diario

Crear un cron job que asigne automáticamente un nuevo desafío cada día:

```typescript
// app/api/cron/daily-challenge/route.ts
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const today = new Date()
  await createDailyChallenge(today)

  return Response.json({ success: true })
}
```

### 2. Notificaciones

Añadir notificaciones cuando:
- Un usuario sube de puesto en el ranking
- Un nuevo desafío diario está disponible
- El usuario completa un desafío diario

### 3. Logros del Ranking

Añadir insignias especiales para:
- Top 10 del ranking
- Top 1 semanal/mensual
- Mejora de 10+ puestos en una semana

### 4. Gráficos de Progreso

Añadir gráficos que muestren:
- Progreso del usuario en el ranking
- XP ganada por semana/mes
- Comparación con amigos

## Solución de Problemas

### El leaderboard no se actualiza

Verifica que:
1. La función `updateLeaderboardForUser` se está llamando después de completar desafíos
2. Los índices de la base de datos están creados
3. No hay errores en la consola del servidor

### El desafío diario no aparece

Verifica que:
1. La API `/api/daily-challenge?action=current` responde correctamente
2. Hay desafíos disponibles en la base de datos
3. La fecha del servidor es correcta

### Error de "Usuario no autenticado"

Asegúrate de:
1. La sesión de NextAuth está configurada correctamente
2. El usuario está logueado
3. El middleware de autenticación está activo

## Credenciales de Prueba

El seed crea los siguientes usuarios de prueba:

- `demo@jogaboneto.com` - Usuario Demo (Nivel 1, 0 XP)
- `player1@jogaboneto.com` - JavaScript Master (Nivel 25, 2500 XP)
- `player2@jogaboneto.com` - Code Ninja (Nivel 18, 1800 XP)
- `player3@jogaboneto.com` - Bug Hunter (Nivel 12, 1200 XP)
- `player4@jogaboneto.com` - Async Wizard (Nivel 9, 950 XP)
- `player5@jogaboneto.com` - Function Guru (Nivel 7, 750 XP)

Contraseña para todos: `password123`

## Soporte

Para problemas o preguntas, consulta la documentación de Next.js y Prisma o abre un issue en el repositorio.
