import { Direction, Freeze, Position, Temperature, Hot } from '../components'
import seele from '../seele'
import { ARCHETYPE_SYSTEM, ID } from '@seele'
import { creatures, moveableArea } from '../../data'

export const WeatherSystem = seele.defineSystem(() => {
  return {
    name: 'weather-system',
    query: q => q.some(Temperature),
    update: (archetypes, delta) => {
      archetypes.forEach(archetype => {
        const entities = archetype.entities

        for (let i = entities.length - 1; i >= 0; i--) {
          const entity = entities[i]
          const temperature = entity[Temperature]

          if (temperature < -50) {
            if (seele.hasComponent(entity[ID], Freeze)) {
              entity[Temperature] += (1 / 180) * delta
            } else {
              entity[Temperature] = 0
              seele.addComponent(entity[ID], Freeze)
            }
          } else if (temperature > 100) {
            if (seele.hasComponent(entity[ID], Hot)) {
              entity[Temperature] -= (1 / 180) * delta
            } else {
              entity[Temperature] = 0
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
              const newTemperature = Math.max(-100, Math.min(100, temperature + Math.round(delta * (Math.random() * 2 - 1) * 2)))
              entity[Temperature] = newTemperature
            }
          }
        }
      })
    },
    type: ARCHETYPE_SYSTEM,
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
    update: (entities, delta) => {
      for (let i = entities.length - 1; i >= 0; i--) {
        const entity = entities[i]

        entity[Position].x += entity[Direction].x * Math.round(Math.random() * 1 * delta)
        entity[Position].y += entity[Direction].y * Math.round(Math.random() * 1 * delta)
      }
    },
  }
})

export const CollisionDetectSystem = seele.defineSystem(() => {
  return {
    name: 'collision-detect-system',
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

  const fps = 41.7

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
    type: ARCHETYPE_SYSTEM,
  }
})

export const StatisticSystem = seele.defineSystem(() => {
  const limit = 3000
  let acc = 0
  return {
    name: 'statisticSystem',
    query: q => q.custom(() => false),
    update: (_, delta) => {
      acc += delta

      if (acc > limit) {
        seele.stop()
      }
    },
    type: ARCHETYPE_SYSTEM,
  }
})

// export const FrameLimitSystem = seele.defineSystem(() => {

// })
