import { Seele, BitSet } from '@seele'

const bitset = BitSet(1)

console.log(bitset.has(35))
bitset.or(35)
console.log(bitset.has(35))
console.log('wt', bitset.mask)

export default Seele()
