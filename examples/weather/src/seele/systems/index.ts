import { Direction, Freeze, Position, Temperature, Hot } from '../components'
import seele from '../seele'
import { ID } from '@seele'
import { creatures, moveableArea, fps } from '../../data'
import { Creature } from '../entities'

export const WeatherSystem = seele.defineSystem(() => {
  return {
    name: 'weather-system',
    query: q => q.some(Temperature),
    update: (entities) => {
      for (let i = entities.length - 1; i >= 0; i--) {
        const entity = entities[i]
        const temperature = entity[Temperature]

        // const newTemperature = Math.max(-100, Math.min(100, temperature + Math.round((Math.random() * 2 - 1) * 10)))
        // entity[Temperature] = newTemperature

        if (temperature < -50) {
          if (seele.hasComponent(entity[ID], Freeze)) {
            entity[Temperature] += 1
          } else {
            entity[Temperature] -= 50
            seele.addComponent(entity[ID], Freeze)
          }
        } else if (temperature > 100) {
          if (seele.hasComponent(entity[ID], Hot)) {
            entity[Temperature] -= 1
          } else {
            entity[Temperature] += 50
            seele.addComponent(entity[ID], Hot)
          }
        } else {
          if (seele.hasComponent(entity[ID], Freeze)) {
            seele.defer(() => {
              seele.removeComponent(entity[ID], Freeze)
            })
            entity[Temperature] = 0
          } else if (seele.hasComponent(entity[ID], Hot)) {
            seele.defer(() => {
              seele.removeComponent(entity[ID], Hot)
            })
            entity[Temperature] = 0
          } else {
            const newTemperature = Math.max(-100, Math.min(100, temperature + Math.round((Math.random() * 2 - 1) * 10)))
            entity[Temperature] = newTemperature
          }
        }
      }
    },
  }
})

export const FreezeSystem = seele.defineSystem(() => {
  return {
    name: 'freeze-system',
    query: q => q.some(Temperature),
    update: (entities) => {
      for (let i = entities.length - 1; i >= 0; i--) {
        const entity = entities[i]
        const temperature = entity[Temperature]

        if (temperature < -50) {
          seele.addComponent(entity[ID], Freeze)
        } else if (temperature > 100) {
          seele.addComponent(entity[ID], Hot)
        } else {
          seele.removeComponent(entity[ID], Freeze)
          seele.removeComponent(entity[ID], Hot)
        }
      }
    },
  }
})

export const MovementSystem = seele.defineSystem(() => {
  return {
    name: 'movement-system',
    query: q => q.some(Position, Direction).not(Freeze),
    update: (entities) => {
      for (let i = entities.length - 1; i >= 0; i--) {
        const entity = entities[i]

        entity[Position].x += entity[Direction].x * Math.round(Math.random() * 10)
        entity[Position].y += entity[Direction].y * Math.round(Math.random() * 10)
      }
    },
  }
})

export const CollisionDetectSystem = seele.defineSystem(() => {
  return {
    name: 'movement-system',
    query: q => q.some(Position, Direction),
    update: (entities) => {
      for (let i = entities.length - 1; i >= 0; i--) {
        const entity = entities[i]
        const position = entity[Position]
        if (position.x > moveableArea.right) {
          entity[Direction].x *= -1
          entity[Position].x = moveableArea.right
        } else if (position.x < moveableArea.left) {
          entity[Direction].x *= -1
          entity[Position].x = moveableArea.left
        }

        if (position.y > moveableArea.bottom) {
          entity[Direction].y *= -1
          entity[Position].y = moveableArea.bottom
        } else if (position.y < moveableArea.top) {
          entity[Direction].y *= -1
          entity[Position].y = moveableArea.top
        }
      }
    },
  }
})

export const CreatureRendererSystem = seele.defineSystem(() => {
  let duration = 0
  let last = performance.now()

  const fps = 16.7

  return {
    name: 'CreatureRendererSystem',
    query: q => q.some(Position),
    update: (archetypes) => {
      duration += performance.now() - last
      last = performance.now()

      if (duration < fps) {
        return
      }
      duration = 0

      creatures.value = []

      for (let i = archetypes.length - 1; i >= 0; i--) {
        const archetype = archetypes[i]

        creatures.value = creatures.value.concat(archetype.entities)
      }
    },
    type: 1,
  }
})

export const StatisticSystem = seele.defineSystem(() => {
  let duration = 0
  let last = 0
  let count = 0

  return {
    name: 'statisticSystem',
    query: q => q.custom(() => false),
    update: () => {
      duration += performance.now() - last
      last = performance.now()
      count += 1

      if (duration >= 1000) {
        fps.value = count
        count = 0
        duration = duration - 1000
      }
    },
    type: 1,
  }
})
