export type BitSet = {
  size: number
  mask: Uint32Array
  has: (value: number) => boolean
  contains: (other: BitSet) => boolean
  intersects: (other: BitSet) => boolean
  or: (value: number) => BitSet
  xor: (value: number) => BitSet
  clone: () => BitSet
  toString: (radix?: number) => string
  values: () => number[]
}

/**
 * |-------|------------|
 * | index | remainder  |
 * |-------|------------|
 *
 * In order for the BitSet to carry as many ComponentIDs/EntityIDs as possible,
 * a Uint32Array is used here to split the input value.
 * The rule is that value divided by a multiple of 32 is the index of the mask,
 * and the remainder of value divided by 32 is the value's position on mask[index].
 * Equivalent to value >>> 5 and 1 << (value & 31). Here value & 31 is value % 32
 * The reason for choosing 32 as the divisor is that Uint32 can hold up to 32 1s.
 *
 * Also:
 * since Uint32Array requires a pre-set buffer length, it is not like a normal JS array where you can freely assign any index,
 * when index > buffer_length, you need to expand the length manually.
 *
 * For example:
 *
 * const a = []
 * a[7] = 123
 * console.log(a[7]) // 123
 *
 * const b = new Uint32Array(5)
 * b[7] = 123
 * console.log(b[7]) // undefined
 *
 * b[4] = 123
 * console.log(b[4]) // 123
 *
 * @param size
 * @returns
 */
export function BitSet(size: number): BitSet {
  let mask = new Uint32Array(size)

  function grow(index: number) {
    if (index < size) {
      return
    }

    const oldMask = mask

    size = index + 1
    mask = new Uint32Array(size)
    mask.set(oldMask)
  }

  return {
    mask,
    get size() {
      return size
    },
    has(value: number) {
      const index = value >>> 5

      if (index >= size) {
        return false
      }

      const remainder = 1 << (value & 31)

      return Boolean(mask[index] & remainder)
    },
    contains(other: BitSet) {
      if (other.mask === mask) {
        return true
      }

      for (let i = 0; i < other.size; i++) {
        const a = mask[i]
        const b = other.mask[i]

        if ((a & b) !== b) {
          return false
        }
      }

      return true
    },
    intersects(other: BitSet) {
      if (other.mask === mask) {
        return true
      }

      const length = Math.min(mask.length, other.mask.length)

      for (let i = 0; i < length; i++) {
        const a = mask[i]
        const b = other.mask[i]

        if ((a & b) !== 0) {
          return true
        }
      }

      return false
    },
    or(value: number) {
      const index = value >>> 5
      const remainder = 1 << (value & 31)
      grow(index)
      mask[index] |= remainder

      return this
    },
    xor(value: number) {
      const index = value >>> 5
      const remainder = 1 << (value & 31)
      grow(index)
      mask[index] ^= remainder

      return this
    },
    clone() {
      const bitset = BitSet(size)
      bitset.mask.set(mask)

      return bitset
    },
    toString(radix = 16) {
      if (mask.length === 0) {
        return '0'
      }

      return mask.reduceRight((str, num) => str += num.toString(radix), '')
    },
    values() {
      const values: number[] = []

      for (let i = 0; i < mask.length; i++) {
        const bits = mask[i]

        for (let shift = 0; shift < 32; shift++) {
          if (bits & (1 << shift)) {
            values.push(i << 5 | shift)
          }
        }
      }

      return values
    },
  }
}

export function Mask(values: number[]) {
  const max = Math.max(...values)
  const size = Math.max(0, Math.ceil(max / 32))
  const bitset = BitSet(size)

  values.forEach(bitset.or)

  return bitset
}
