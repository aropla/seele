import seele from '../seele'

export const Freeze = seele.defineComponent()
export const Hot = seele.defineComponent()
export const Position = seele.defineComponent(() => ({
  x: 0,
  y: 0,
}))
export const Temperature = seele.defineComponent(0)
export const Name = seele.defineComponent('')
export const HP = seele.defineComponent(100)
export const Direction = seele.defineComponent(() => ({
  x: 1,
  y: 1,
}))
