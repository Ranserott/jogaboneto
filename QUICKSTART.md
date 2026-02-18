# Quick Start - JogaBoneto con Ranking y Desafío Diario

## Pasos Iniciales

### 1. Instalar dependencias (si no lo has hecho)

```bash
npm install
```

### 2. Configurar la base de datos

```bash
# Aplicar el schema actualizado
npm run db:push

# Poblar con datos de prueba
npm run db:seed
```

### 3. Iniciar el servidor

```bash
npm run dev
```

### 4. Acceder a la aplicación

Abre tu navegador en: http://localhost:3000

## Credenciales de Prueba

El seed crea 6 usuarios. Usa cualquiera de estos:

| Usuario | Contraseña | Nivel | XP |
|---------|------------|-------|-----|
| demo@jogaboneto.com | password123 | 1 | 0 |
| player1@jogaboneto.com | password123 | 25 | 2500 |
| player2@jogaboneto.com | password123 | 18 | 1800 |
| player3@jogaboneto.com | password123 | 12 | 1200 |
| player4@jogaboneto.com | password123 | 9 | 950 |
| player5@jogaboneto.com | password123 | 7 | 750 |

## Nuevas Funcionalidades

### Desafío Diario

En el dashboard (`/dashboard`) verás:
- **Tarjeta de Desafío Diario**: Un desafío nuevo cada día con +50 XP bonus
- **Countdown**: Tiempo restante para el próximo desafío
- **Indicador de completado**: Muestra si ya lo completaste hoy

### Ranking Global

Accede a `/leaderboard` o desde el botón "Ranking" en el dashboard:
- **Top 50 jugadores**: Los mejores jugadores ordenados por XP
- **Tu posición**: Resaltada en azul si estás en el ranking
- **Filtros**: Histórico, Semana, Mes
- **Estadísticas**: Nivel, XP, Puntos, Racha

## Probar las APIs

### Obtener Ranking

```bash
curl http://localhost:3000/api/leaderboard
```

### Obtener tu Posición

```bash
curl http://localhost:3000/api/leaderboard?userId=me
```

### Obtener Desafío Diario

```bash
curl http://localhost:3000/api/daily-challenge?action=current
```

## Arquitectura

```
src/
├── app/
│   ├── api/
│   │   ├── leaderboard/
│   │   │   └── route.ts          # API del ranking
│   │   └── daily-challenge/
│   │       ├── route.ts          # API del desafío
│   │       └── submit/
│   │           └── route.ts      # Submit del desafío
│   ├── dashboard/
│   │   └── page.tsx              # Dashboard actualizado
│   └── leaderboard/
│       └── page.tsx              # Página de ranking
├── components/
│   ├── leaderboard/
│   │   └── LeaderboardTable.tsx  # Tabla de ranking
│   ├── dashboard/
│   │   └── DailyChallengeCard.tsx # Tarjeta de desafío
│   └── ui/                       # Componentes UI existentes
└── lib/
    ├── leaderboard.ts            # Helper de leaderboard
    ├── daily-challenge.ts        # Helper de desafío diario
    └── prisma.ts                 # Cliente de Prisma
```

## Troubleshooting

### Error: "Relation not found"

```bash
npm run db:push
```

### El leaderboard no aparece

Asegúrate de ejecutar el seed:

```bash
npm run db:seed
```

### El desafío diario no aparece

Verifica que hay challenges en la base de datos. El seed crea mundos y niveles automáticamente.

## Próximos Pasos

1. **Explora el dashboard**: Ver el desafío diario y tu progreso
2. **Completa desafíos**: Gana XP y sube en el ranking
3. **Visita el ranking**: Compite con otros jugadores
4. **Repite mañana**: Nuevo desafío diario disponible

## Documentación Adicional

- `/RANKING_SETUP.md` - Guía completa de configuración
- `/IMPLEMENTATION_SUMMARY.md` - Resumen técnico detallado

---

¡Disfruta aprendiendo JavaScript con JogaBoneto! 🚀
