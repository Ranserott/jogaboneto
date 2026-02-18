/**
 * Validadores de Código JavaScript
 *
 * Proporciona funciones para validar diferentes aspectos del código
 */

/**
 * Valida que el código tenga una estructura válida
 */
export function validateCodeStructure(code: string): { valid: boolean; error?: string; hints?: string[] } {
  const trimmedCode = code.trim()

  // Verificar que no esté vacío
  if (!trimmedCode) {
    return {
      valid: false,
      error: 'El código está vacío',
      hints: ['Escribe algo de código para resolver el desafío.'],
    }
  }

  // Verificar que no sea solo comentarios
  const withoutComments = trimmedCode
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim()

  if (!withoutComments) {
    return {
      valid: false,
      error: 'El código solo contiene comentarios',
      hints: ['Agrega código real para resolver el desafío.'],
    }
  }

  return { valid: true }
}

/**
 * Valida que el código contenga patrones requeridos
 */
export function validateRequiredPatterns(code: string, patterns: string[]): { valid: boolean; error?: string; hints?: string[] } {
  const missing: string[] = []

  for (const pattern of patterns) {
    // Verificar si el patrón es una palabra clave o estructura
    const regex = new RegExp(`\\b${pattern}\\b`, 'i')
    if (!regex.test(code) && !code.includes(pattern)) {
      missing.push(pattern)
    }
  }

  if (missing.length > 0) {
    return {
      valid: false,
      error: `Faltan patrones requeridos: ${missing.join(', ')}`,
      hints: [
        ...missing.map(p => `Deberías usar: "${p}"`),
        'Revisa el enunciado del desafío para ver qué estructuras debes usar.',
      ],
    }
  }

  return { valid: true }
}

/**
 * Valida que el código NO contenga patrones prohibidos
 */
export function validateForbiddenPatterns(code: string, patterns: string[]): { valid: boolean; error?: string; hints?: string[] } {
  const found: string[] = []

  for (const pattern of patterns) {
    // Patrones específicos
    if (pattern === 'var') {
      // Detectar declaración de variables con var
      const varRegex = /\bvar\s+\w+/g
      if (varRegex.test(code)) {
        found.push('var (usa let o const en su lugar)')
      }
    } else if (pattern === 'eval') {
      // Detectar uso de eval
      if (/\.?\beval\s*\(/.test(code)) {
        found.push('eval() (es peligroso y no se debe usar)')
      }
    } else if (pattern === '==' || pattern === '!=') {
      // Detectar comparaciones no estrictas
      if (new RegExp(`\\s${pattern}\\s*=`).test(code) || new RegExp(`\\s${pattern}\\s`).test(code)) {
        found.push(`${pattern} (usa ${pattern}= para comparación estricta)`)
      }
    } else if (code.includes(pattern)) {
      found.push(pattern)
    }
  }

  if (found.length > 0) {
    return {
      valid: false,
      error: `Patrones prohibidos detectados: ${found.join(', ')}`,
      hints: found.map(f => `No uses: "${f}"`),
    }
  }

  return { valid: true }
}

/**
 * Valida que sea una función válida
 */
export function validateFunction(code: string): { valid: boolean; functionName?: string; error?: string } {
  // Verificar diferentes formas de declaración de función
  const functionRegex = /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:function|\([^)]*\)\s*=>))/g
  const match = functionRegex.exec(code)

  if (!match) {
    return {
      valid: false,
      error: 'No se encontró una declaración de función válida',
    }
  }

  const functionName = match[1] || match[2]
  return { valid: true, functionName }
}

/**
 * Valida el valor de retorno esperado
 */
export function validateReturn(code: string, expected?: any): { valid: boolean; actual?: any; hints?: string[] } {
  // Buscar declaraciones return
  const returnRegex = /return\s+([^;};]+)/g
  const matches = [...code.matchAll(returnRegex)]

  if (matches.length === 0) {
    return {
      valid: false,
      hints: ['Tu función debería retornar un valor usando "return".'],
    }
  }

  if (expected !== undefined) {
    // Extraer el valor del return
    const returnValues = matches.map(m => m[1].trim())

    // Esta es una validación básica, en un entorno real se ejecutaría el código
    return {
      valid: true,
      actual: returnValues[0],
    }
  }

  return { valid: true }
}

/**
 * Valida que se use console.log para salida
 */
export function validateConsoleLog(code: string): { valid: boolean; count: number; hints?: string[] } {
  const logMatches = code.match(/console\.log\s*\(/g)
  const count = logMatches ? logMatches.length : 0

  if (count === 0) {
    return {
      valid: false,
      count: 0,
      hints: ['Deberías usar console.log() para mostrar el resultado.'],
    }
  }

  return { valid: true, count }
}

/**
 * Valida el uso de estructuras específicas
 */
export function validateUsage(code: string, structure: string): { valid: boolean; error?: string; hints?: string[] } {
  switch (structure) {
    case 'for':
    case 'while':
    case 'do-while':
      return validateLoop(code, structure)

    case 'if':
    case 'switch':
    case 'ternary':
      return validateConditional(code, structure)

    case 'function':
    case 'arrow':
      return validateFunctionType(code, structure)

    case 'map':
    case 'filter':
    case 'reduce':
    case 'forEach':
    case 'find':
      return validateArrayMethod(code, structure)

    default:
      return { valid: true }
  }
}

function validateLoop(code: string, type: string): { valid: boolean; error?: string; hints?: string[] } {
  const hasFor = /\bfor\s*\(/.test(code)
  const hasWhile = /\bwhile\s*\(/.test(code)
  const hasDoWhile = /\bdo\s*{[\s\S]*}\s*while\s*\(/.test(code)

  switch (type) {
    case 'for':
      if (!hasFor) {
        return {
          valid: false,
          error: 'Deberías usar un bucle for',
          hints: ['Usa "for" para iterar sobre el array.'],
        }
      }
      break

    case 'while':
      if (!hasWhile) {
        return {
          valid: false,
          error: 'Deberías usar un bucle while',
          hints: ['Usa "while" para crear un bucle condicional.'],
        }
      }
      break

    case 'do-while':
      if (!hasDoWhile) {
        return {
          valid: false,
          error: 'Deberías usar un bucle do-while',
          hints: ['Usa "do-while" para ejecutar al menos una vez.'],
        }
      }
      break
  }

  return { valid: true }
}

function validateConditional(code: string, type: string): { valid: boolean; error?: string; hints?: string[] } {
  const hasIf = /\bif\s*\(/.test(code)
  const hasSwitch = /\bswitch\s*\(/.test(code)
  const hasTernary = /\?[^:]*:/.test(code)

  switch (type) {
    case 'if':
      if (!hasIf) {
        return {
          valid: false,
          error: 'Deberías usar una condicional if',
          hints: ['Usa "if" para crear una condición.'],
        }
      }
      break

    case 'switch':
      if (!hasSwitch) {
        return {
          valid: false,
          error: 'Deberías usar una sentencia switch',
          hints: ['Usa "switch" para manejar múltiples casos.'],
        }
      }
      break

    case 'ternary':
      if (!hasTernary) {
        return {
          valid: false,
          error: 'Deberías usar el operador ternario',
          hints: ['Usa "? :" para una condición compacta.'],
        }
      }
      break
  }

  return { valid: true }
}

function validateFunctionType(code: string, type: string): { valid: boolean; error?: string; hints?: string[] } {
  const hasTraditional = /function\s*\w*\s*\(/.test(code)
  const hasArrow = /\([^)]*\)\s*=>|[^=]\s*=>/.test(code)

  switch (type) {
    case 'function':
      if (!hasTraditional) {
        return {
          valid: false,
          error: 'Deberías usar una función tradicional',
          hints: ['Usa "function nombre() {}".'],
        }
      }
      break

    case 'arrow':
      if (!hasArrow) {
        return {
          valid: false,
          error: 'Deberías usar una arrow function',
          hints: ['Usa "() => {}" para crear una función flecha.'],
        }
      }
      break
  }

  return { valid: true }
}

function validateArrayMethod(code: string, method: string): { valid: boolean; error?: string; hints?: string[] } {
  const pattern = `\\.\\s*${method}\\s*\\(`
  const hasMethod = new RegExp(pattern).test(code)

  if (!hasMethod) {
    return {
      valid: false,
      error: `Deberías usar el método .${method}()`,
      hints: [`Usa ".${method}()" en tu array.`],
    }
  }

  return { valid: true }
}
