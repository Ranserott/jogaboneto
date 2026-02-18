# JogaBoneto 🎮

Plataforma gamificada de aprendizaje de JavaScript con 9 mundos educativos.

## 🚀 Características

- **9 Mundos Educativos**: Desde conceptos básicos hasta avanzados de JavaScript
- **Sistema de Gamificación**: Puntos, XP, niveles, insignias y rachas
- **Ejercicios Prácticos**: Código, quizzes y drag-and-drop
- **Autenticación**: Con NextAuth v5
- **Base de Datos**: PostgreSQL con Prisma ORM

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de Datos**: PostgreSQL
- **ORM**: Prisma
- **Autenticación**: NextAuth v5
- **UI**: Componentes personalizados con Radix UI

## 📦 Instalación

1. Clonar el repositorio:
```bash
git clone <your-repo-url>
cd jogaboneto
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. Configurar base de datos PostgreSQL y actualizar `DATABASE_URL` en `.env`

5. Inicializar base de datos:
```bash
npm run prisma:push
npm run prisma:seed
```

6. Ejecutar en modo desarrollo:
```bash
npm run dev
```

7. Abrir [http://localhost:3000](http://localhost:3000)

## 📚 Estructura del Proyecto

```
jogaboneto/
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   ├── client.ts               # Cliente Prisma
│   └── seed.ts                 # Datos de ejemplo
├── src/
│   ├── app/                    # Páginas Next.js App Router
│   ├── components/            # Componentes React
│   │   └── ui/                 # Componentes UI reutilizables
│   ├── lib/                    # Utilidades y configuraciones
│   ├── types/                  # Definiciones TypeScript
│   └── hooks/                  # Custom React Hooks
└── public/                     # Archivos estáticos
```

## 🎮 Los 9 Mundos

1. **Variables y Constantes** - Conceptos básicos
2. **Tipos de Datos** - Primitivos y objetos
3. **Operadores** - Aritméticos, lógicos y de comparación
4. **Control de Flujo** - Condicionales y bucles
5. **Funciones** - Declaración, expresión y flecha
6. **Arrays** - Métodos y manipulación
7. **Objetos** - Propiedades y métodos
8. **DOM Manipulation** - Interacción con el navegador
9. **Asincronía** - Promesas, async/await y fetch API

## 🏆 Sistema de Puntos

- Cada reto completado: **10 puntos**
- Cada desafío: **5 XP**
- Niveles por mundo: 3 (fácil, medio, difícil)
- 3 desafíos por nivel

## 🎖️ Insignias

- **Primeros Pasos**: Completar el Mundo 1
- **Maestro Arrays**: Completar el Mundo 6
- **Ninja Asincrono**: Completar el Mundo 9
- **Racha de Fuego**: 5 días consecutivos de práctica
- **Y muchas más...**

## 📄 Licencia

MIT
