import { SparseSet } from '@/utils/SparseSet'

test('Sparset', () => {
  const set = SparseSet()

  expect(set.has(5)).toBe(false)

  set.add(5)
  expect(set.has(5)).toBe(true)

  set.remove(5)
  expect(set.has(5)).toBe(false)
})
