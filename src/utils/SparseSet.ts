export type SparseSet = {
  values: number[]
  has(value: number): boolean
  add(value: number): number
  remove(value: number): number
}

export function SparseSet(): SparseSet {
  const values: number[] = []
  const indices: number[] = []

  const has = (value: number) => {
    const index = indices[value]

    return values[index] === value
  }

  return {
    values,
    has,
    add(value: number) {
      if (has(value)) {
        return -1
      }

      values.push(value)

      const addedPosition = values.length - 1
      indices[value] = addedPosition

      return addedPosition
    },
    remove(value: number) {
      if (!has(value)) {
        return -1
      }

      const lastValue = values.pop() as number
      const removedPosition = indices[value]

      if (lastValue === value) {
        return removedPosition
      }

      values[removedPosition] = lastValue
      indices[lastValue] = removedPosition

      return removedPosition
    }
  }
}
