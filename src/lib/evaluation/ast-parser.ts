/**
 * Parser AST Simplificado para JavaScript
 *
 * Este módulo proporciona análisis de código JavaScript sin dependencias pesadas.
 * Para producción se recomienda usar @babel/parser o acorn.
 */

/**
 * Parsea código JavaScript y retorna un AST simplificado
 */
export function parseAST(code: string): any {
  // AST simplificado - extrae información básica del código
  const result = {
    type: 'Program',
    body: [] as any[],
  }

  // Eliminar comentarios
  const cleanCode = code
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')

  // Detectar declaraciones de función
  const functionMatches = cleanCode.match(/function\s+(\w+)\s*\(([^)]*)\)\s*\{/g)
  if (functionMatches) {
    functionMatches.forEach(match => {
      const nameMatch = match.match(/function\s+(\w+)/)
      const paramsMatch = match.match(/function\s+\w+\s*\(([^)]*)\)/)
      result.body.push({
        type: 'FunctionDeclaration',
        name: nameMatch?.[1],
        params: paramsMatch?.[1]?.split(',').map(p => p.trim()) || [],
      })
    })
  }

  // Detectar arrow functions
  const arrowMatches = cleanCode.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:\(([^)]*)\)|(\w+))\s*=>/g)
  if (arrowMatches) {
    arrowMatches.forEach(match => {
      const nameMatch = match.match(/(?:const|let|var)\s+(\w+)/)
      const params1 = match.match(/\(([^)]*)\)/)
      const params2 = match.match(/(\w+)\s*=>/)
      result.body.push({
        type: 'ArrowFunctionExpression',
        name: nameMatch?.[1],
        params: params1?.[1]?.split(',').map(p => p.trim()) || (params2?.[1] ? [params2[1]] : []),
      })
    })
  }

  // Detectar bucles
  const forMatches = cleanCode.match(/for\s*\(([^;]+);([^;]+);([^)]+)\)\s*\{/g)
  if (forMatches) {
    forMatches.forEach(() => {
      result.body.push({ type: 'ForStatement' })
    })
  }

  const whileMatches = cleanCode.match(/while\s*\(([^)]+)\)\s*\{/g)
  if (whileMatches) {
    whileMatches.forEach(() => {
      result.body.push({ type: 'WhileStatement' })
    })
  }

  // Detectar condicionales
  const ifMatches = cleanCode.match(/if\s*\(([^)]+)\)\s*\{/g)
  if (ifMatches) {
    ifMatches.forEach(() => {
      result.body.push({ type: 'IfStatement' })
    })
  }

  const switchMatches = cleanCode.match(/switch\s*\(([^)]+)\)\s*\{/g)
  if (switchMatches) {
    switchMatches.forEach(() => {
      result.body.push({ type: 'SwitchStatement' })
    })
  }

  // Detectar ternarios
  const ternaryMatches = cleanCode.match(/([^?]+)\s*\?\s*([^:]+)\s*:\s*([^;,]+)/g)
  if (ternaryMatches) {
    ternaryMatches.forEach(() => {
      result.body.push({ type: 'ConditionalExpression' })
    })
  }

  // Detectar usos de array methods
  const arrayMethods = ['map', 'filter', 'reduce', 'forEach', 'find', 'some', 'every', 'sort']
  arrayMethods.forEach(method => {
    const regex = new RegExp(`\\.\\s*${method}\\s*\\(`, 'g')
    const matches = cleanCode.match(regex)
    if (matches) {
      matches.forEach(() => {
        result.body.push({ type: 'CallExpression', method: `.${method}()` })
      })
    }
  })

  return result
}

/**
 * Detecta si el código usa bucles
 */
export function detectLoops(ast: any): boolean {
  if (!ast || !ast.body) return false

  return ast.body.some((node: any) =>
    node.type === 'ForStatement' ||
    node.type === 'WhileStatement' ||
    node.type === 'DoWhileStatement'
  )
}

/**
 * Detecta si el código usa condicionales
 */
export function detectConditionals(ast: any): boolean {
  if (!ast || !ast.body) return false

  return ast.body.some((node: any) =>
    node.type === 'IfStatement' ||
    node.type === 'SwitchStatement' ||
    node.type === 'ConditionalExpression'
  )
}

/**
 * Detecta si el código define funciones
 */
export function detectFunctions(ast: any): { hasFunctions: boolean; names: string[] } {
  if (!ast || !ast.body) return { hasFunctions: false, names: [] }

  const functionNodes = ast.body.filter((node: any) =>
    node.type === 'FunctionDeclaration' ||
    node.type === 'ArrowFunctionExpression'
  )

  return {
    hasFunctions: functionNodes.length > 0,
    names: functionNodes.map((n: any) => n.name).filter(Boolean),
  }
}

/**
 * Detecta si el código usa un método específico de array
 */
export function detectArrayMethod(ast: any, method: string): boolean {
  if (!ast || !ast.body) return false

  return ast.body.some((node: any) =>
    node.type === 'CallExpression' && node.method === `.${method}()`
  )
}

/**
 * Cuenta la complejidad ciclomática del código
 */
export function calculateComplexity(ast: any): number {
  if (!ast || !ast.body) return 0

  let complexity = 1 // Base complexity

  ast.body.forEach((node: any) => {
    if (
      node.type === 'IfStatement' ||
      node.type === 'WhileStatement' ||
      node.type === 'ForStatement' ||
      node.type === 'ConditionalExpression'
    ) {
      complexity++
    }

    if (node.type === 'SwitchStatement') {
      // Switch cases add complexity
      complexity += 2 // Estimación básica
    }
  })

  return complexity
}

/**
 * Extrae todos los identificadores (nombres de variables, funciones) del código
 */
export function extractIdentifiers(code: string): string[] {
  const identifiers: string[] = []

  // Palabras clave a ignorar
  const keywords = new Set([
    'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while',
    'return', 'break', 'continue', 'switch', 'case', 'default',
    'true', 'false', 'null', 'undefined', 'typeof', 'instanceof',
    'new', 'this', 'super', 'class', 'extends', 'import', 'export',
    'async', 'await', 'try', 'catch', 'finally', 'throw', 'delete',
  ])

  // Extraer declaraciones const/let/var
  const declarations = code.match(/(?:const|let|var)\s+(\w+)/g)
  if (declarations) {
    declarations.forEach(decl => {
      const match = decl.match(/(?:const|let|var)\s+(\w+)/)
      if (match && !keywords.has(match[1])) {
        identifiers.push(match[1])
      }
    })
  }

  // Extraer nombres de función
  const functions = code.match(/function\s+(\w+)/g)
  if (functions) {
    functions.forEach(fn => {
      const match = fn.match(/function\s+(\w+)/)
      if (match) {
        identifiers.push(match[1])
      }
    })
  }

  // Extraer parámetros de función
  const params = code.match(/function\s*\w*\s*\(([^)]*)\)/g)
  if (params) {
    params.forEach(paramList => {
      const match = paramList.match(/function\s*\w*\s*\(([^)]*)\)/)
      if (match && match[1]) {
        match[1].split(',').forEach(p => {
          const trimmed = p.trim()
          if (trimmed && !keywords.has(trimmed)) {
            identifiers.push(trimmed)
          }
        })
      }
    })
  }

  return [...new Set(identifiers)] // Unique only
}

/**
 * Analiza el código y retorna métricas
 */
export function analyzeCodeMetrics(code: string): {
  lines: number
  statements: number
  functions: number
  loops: number
  conditionals: number
  complexity: number
  identifiers: string[]
} {
  const lines = code.split('\n').filter(l => l.trim()).length
  const ast = parseAST(code)

  const functions = ast.body.filter((n: any) =>
    n.type === 'FunctionDeclaration' || n.type === 'ArrowFunctionExpression'
  ).length

  const loops = ast.body.filter((n: any) =>
    n.type === 'ForStatement' || n.type === 'WhileStatement'
  ).length

  const conditionals = ast.body.filter((n: any) =>
    n.type === 'IfStatement' || n.type === 'SwitchStatement' || n.type === 'ConditionalExpression'
  ).length

  // Estimar declaraciones (líneas que terminan en ; o { )
  const statements = code.split(/[;{]/).filter(s => s.trim()).length

  return {
    lines,
    statements,
    functions,
    loops,
    conditionals,
    complexity: calculateComplexity(ast),
    identifiers: extractIdentifiers(code),
  }
}
