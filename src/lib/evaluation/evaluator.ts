/**
 * Evaluador Inteligente de Código JavaScript
 *
 * Este módulo proporciona una evaluación segura de código JavaScript
 * con validación de estructura y ejecución en sandbox.
 */

import { validateCodeStructure, validateRequiredPatterns, validateForbiddenPatterns } from './validators'
import { parseAST, detectLoops, detectConditionals, detectFunctions } from './ast-parser'

// Tipos de testCase para desafíos
export interface TestCase {
  shouldContain?: string | string[]
  shouldNotContain?: string | string[]
  expectedOutput?: any
  throwError?: boolean
}

// Configuración de evaluación
export interface EvaluationConfig {
  code: string
  testCase?: TestCase
  mustUse?: string[]  // Patrones que DEBE usar (ej: ['for', 'while'])
  forbidden?: string[]  // Patrones que NO debe usar (ej: ['var', 'eval'])
  timeout?: number
  expectedSolution?: string  // Solución esperada para comparación
}

// Resultado de evaluación
export interface EvaluationResult {
  success: boolean
  passed: boolean
  feedback: string
  output?: any
  error?: string
  hints?: string[]
  score?: number
}

/**
 * Evalúa código JavaScript con múltiples validaciones
 */
export async function evaluateJavaScript(config: EvaluationConfig): Promise<EvaluationResult> {
  const { code, testCase, mustUse = [], forbidden = [], expectedSolution } = config

  // 1. Validación de sintaxis básica
  const syntaxCheck = validateSyntax(code)
  if (!syntaxCheck.valid) {
    return {
      success: false,
      passed: false,
      feedback: 'Error de sintaxis',
      error: syntaxCheck.error,
      hints: ['Revisa tu código. Parece haber un error de sintaxis.'],
    }
  }

  // 2. Validación de patrones prohibidos
  if (forbidden.length > 0) {
    const forbiddenCheck = validateForbiddenPatterns(code, forbidden)
    if (!forbiddenCheck.valid) {
      return {
        success: false,
        passed: false,
        feedback: 'Patrones prohibidos detectados',
        error: forbiddenCheck.error,
        hints: forbiddenCheck.hints,
      }
    }
  }

  // 3. Validación de patrones requeridos
  if (mustUse.length > 0) {
    const requiredCheck = validateRequiredPatterns(code, mustUse)
    if (!requiredCheck.valid) {
      return {
        success: false,
        passed: false,
        feedback: 'Faltan patrones requeridos',
        error: requiredCheck.error,
        hints: requiredCheck.hints,
      }
    }
  }

  // 4. Validación de estructura del código
  const structureCheck = validateCodeStructure(code)
  if (!structureCheck.valid) {
    return {
      success: false,
      passed: false,
      feedback: 'Estructura de código inválida',
      error: structureCheck.error,
      hints: structureCheck.hints,
    }
  }

  // 5. Análisis AST para verificaciones adicionales
  const astAnalysis = analyzeCodeStructure(code)

  // 6. Validación contra testCase
  let testCaseResult = { valid: true, hints: [] as string[] }
  if (testCase) {
    testCaseResult = validateAgainstTestCase(code, testCase, astAnalysis)
    if (!testCaseResult.valid) {
      return {
        success: false,
        passed: false,
        feedback: 'Código incorrecto',
        error: 'El código no cumple con los requisitos',
        hints: testCaseResult.hints,
      }
    }
  }

  // 7. Comparación con solución esperada (si existe)
  if (expectedSolution) {
    const similarity = calculateSimilarity(code, expectedSolution)
    if (similarity < 0.5) {
      return {
        success: false,
        passed: false,
        feedback: 'El código parece estar muy diferente de la solución esperada',
        hints: ['Revisa la lógica de tu solución.', 'Asegúrate de estar usando las estructuras correctas.'],
        score: Math.floor(similarity * 100),
      }
    }
  }

  // Si pasa todas las validaciones
  return {
    success: true,
    passed: true,
    feedback: '¡Excelente trabajo!',
    hints: [],
    score: 100,
  }
}

/**
 * Valida la sintaxis del código JavaScript
 */
function validateSyntax(code: string): { valid: boolean; error?: string } {
  try {
    // Usar Function constructor para validación de sintaxis
    // NOTA: En producción usar un parser real como @babel/parser
    new Function(code)
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Error de sintaxis desconocido',
    }
  }
}

/**
 * Valida el código contra los casos de prueba
 */
function validateAgainstTestCase(
  code: string,
  testCase: TestCase,
  astAnalysis: any
): { valid: boolean; hints: string[] } {
  const hints: string[] = []

  // Verificar shouldContain
  if (testCase.shouldContain) {
    const patterns = Array.isArray(testCase.shouldContain) ? testCase.shouldContain : [testCase.shouldContain]
    for (const pattern of patterns) {
      if (!code.includes(pattern)) {
        hints.push(`El código debería contener: "${pattern}"`)
      }
    }
  }

  // Verificar shouldNotContain
  if (testCase.shouldNotContain) {
    const patterns = Array.isArray(testCase.shouldNotContain) ? testCase.shouldNotContain : [testCase.shouldNotContain]
    for (const pattern of patterns) {
      if (code.includes(pattern)) {
        hints.push(`El código NO debería contener: "${pattern}"`)
      }
    }
  }

  return {
    valid: hints.length === 0,
    hints,
  }
}

/**
 * Analiza la estructura del código usando AST
 */
function analyzeCodeStructure(code: string) {
  try {
    const ast = parseAST(code)
    return {
      ast,
      hasLoops: detectLoops(ast),
      hasConditionals: detectConditionals(ast),
      hasFunctions: detectFunctions(ast),
    }
  } catch {
    return {
      ast: null,
      hasLoops: false,
      hasConditionals: false,
      hasFunctions: false,
    }
  }
}

/**
 * Calcula la similitud entre dos códigos
 * Usa un algoritmo simple de distancia de Levenshtein
 */
function calculateSimilarity(code1: string, code2: string): number {
  // Normalizar código
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[{}();]/g, '')
      .trim()

  const c1 = normalize(code1)
  const c2 = normalize(code2)

  if (c1 === c2) return 1

  const words1 = c1.split(' ')
  const words2 = c2.split(' ')

  const matches = words1.filter(w => words2.includes(w)).length
  const maxLen = Math.max(words1.length, words2.length)

  return matches / maxLen
}

/**
 * Evalúa código ejecutable (con sandbox básico)
 * WARNING: Esta es una implementación básica. En producción usar isolates-vm
 */
export async function executeCodeSafely(code: string, timeout: number = 5000): Promise<any> {
  return new Promise((resolve, reject) => {
    // Crear un entorno aislado básico
    const sandbox = {
      console: {
        log: (...args: any[]) => ({ type: 'log', args }),
        error: (...args: any[]) => ({ type: 'error', args }),
        warn: (...args: any[]) => ({ type: 'warn', args }),
      },
      // No exponer globals peligrosos
      setTimeout: null,
      setInterval: null,
      fetch: null,
      XMLHttpRequest: null,
      require: null,
      process: null,
      global: null,
    }

    try {
      // Crear función con entorno limitado
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout: El código tomó demasiado tiempo en ejecutarse'))
      }, timeout)

      // Ejecutar en Function constructor con sandbox
      const fn = new Function(...Object.keys(sandbox), code)
      const result = fn(...Object.values(sandbox))

      clearTimeout(timeoutId)
      resolve(result)
    } catch (error) {
      reject(error)
    }
  })
}
