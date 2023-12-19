import { BitSet, Mask } from '@/utils/BitSet'

describe('BitSet', () => {
  describe('toString', () => {
    it('is "0" when default', () => {
      const bitset = BitSet(0)
      expect(bitset.toString()).toBe('0')
    })

    it('works', () => {
      const bitset = BitSet(1)
      bitset.or(3)
      bitset.or(5)

      const radix = 16
      const result = ((1 << 3) + (1 << 5)).toString(radix)
      expect(bitset.toString(radix)).toBe(result)
    })
  })

  describe('or', () => {
    it('works with 0', () => {
      const bitset = BitSet(8)

      expect(bitset.has(0)).toBeFalsy()

      bitset.or(0)
      expect(bitset.has(0)).toBeTruthy()
    })

    it('works', () => {
      const bitset = BitSet(8)

      expect(bitset.has(35)).toBeFalsy()

      bitset.or(35)
      expect(bitset.has(35)).toBeTruthy()
    })
  })

  describe('xor', () => {
    it('works', () => {
      const bitset = BitSet(8)

      expect(bitset.has(35)).toBeFalsy()

      bitset.xor(35)
      expect(bitset.has(35)).toBeTruthy()

      bitset.xor(35)
      expect(bitset.has(35)).toBeFalsy()
    })
  })

  describe('auto-grow', () => {
    it('works', () => {
      const bitset = BitSet(1)

      expect(bitset.size).toBe(1)

      bitset.or(5)
      expect(bitset.size).toBe(1)

      bitset.or(35)
      expect(bitset.size).toBe(2)
    })
  })

  describe('clone', () => {
    it('works', () => {
      const bitsetA = BitSet(1)
      bitsetA.or(35)
      const bitsetB = bitsetA.clone()

      expect(bitsetA.has(35)).toBe(bitsetB.has(35))

      bitsetB.xor(35)
      expect(bitsetA.has(35)).toBe(!bitsetB.has(35))
    })
  })

  describe('values', () => {
    it('works with default', () => {
      const bitset = BitSet(1)

      expect(bitset.values()).toEqual([])
    })

    it('works', () => {
      const bitset = BitSet(1)

      bitset.or(0)
      bitset.or(3)
      bitset.or(5)
      bitset.or(35)

      expect(bitset.values()).toEqual([0, 3, 5, 35])
    })
  })

  describe('mask', () => {
    it('works', () => {
      const componentsIDs = [1, 2, 35]
      const mask = Mask(componentsIDs)

      expect(mask.size).toBe(2)
      expect(mask.values()).toEqual(componentsIDs)
    })
  })

  describe('contains', () => {
    const mask = Mask([1, 2, 35])
    const emptyMask = Mask([])

    it('works with same values', () => {
      const m = Mask([1, 2, 35])
      expect(mask.contains(m)).toBeTruthy()
    })

    it('works with different values', () => {
      const m = Mask([3, 4, 36])
      expect(mask.contains(m)).toBeFalsy()
    })

    it('works with superset', () => {
      const m = Mask([1, 2, 35, 36])
      expect(mask.contains(m)).toBeFalsy()
    })

    it('works with subset', () => {
      const m = Mask([1, 35])
      expect(mask.contains(m)).toBeTruthy()
    })

    it('works with empty bitset', () => {
      expect(mask.contains(emptyMask)).toBeTruthy()
    })

    it('empty bitset works with empty bitset', () => {
      const m = emptyMask.clone()
      expect(emptyMask.contains(m)).toBeTruthy()
    })
  })


  describe('intersects', () => {
    const mask = Mask([1, 2, 35])
    const emptyMask = Mask([])

    it('works with same values', () => {
      const m = Mask([1, 2, 35])
      expect(mask.intersects(m)).toBeTruthy()
    })

    it('works with different values', () => {
      const m = Mask([3, 4, 36])
      expect(mask.intersects(m)).toBeFalsy()
    })

    it('works with superset', () => {
      const m = Mask([1, 2, 35, 36])
      expect(mask.intersects(m)).toBeTruthy()
    })

    it('works with subset', () => {
      const m = Mask([1, 35])
      expect(mask.intersects(m)).toBeTruthy()
    })

    it('works with empty bitset', () => {
      expect(mask.intersects(emptyMask)).toBeFalsy()
    })

    it('empty bitset works with empty bitset', () => {
      const m = emptyMask.clone()
      expect(emptyMask.intersects(m)).toBeFalsy()
    })
  })
})
