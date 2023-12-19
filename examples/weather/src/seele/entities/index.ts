import seele from '../seele'
import { Name, Position, Temperature, HP, Direction } from '../components'

export const Creature = seele.defineEntity(entity => {
  entity
    .addComponent(Position)
    .addComponent(Direction)
    .addComponent(Temperature)
    .addComponent(HP)
    .addComponent(Name)
})
