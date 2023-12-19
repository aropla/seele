export * from './BitSet'
export * from './SparseSet'

export function IDGenerator(start = 0) {
  const deleted: number[] = []
  let id = start

  return {
    next() {
      return (deleted.length > 0 ? deleted.pop() : id++) as number
    },
    set(start: number) {
      id = start
    },
    get() {
      return id
    },
    recycle(id: number) {
      deleted.push(id)
    }
  }
}

export function isPrimitive(value: unknown) {
  const type = typeof value

  return type !== 'function' && type !== 'object'
}

export function isFunction(value: unknown) {
  return typeof value === 'function'
}

export function isObject(value: unknown) {
  return typeof value === 'object' && !Array.isArray(value)
}

export function isNumber(value: unknown) {
  return typeof value === 'number'
}
