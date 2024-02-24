import { Archetype } from '@/Archetype'
import { Seele, ARCHETYPE_SYSTEM } from '@/index'
import { EntityInstance } from '@/types'

const traverse = (obj: EntityInstance[] | Archetype[], fn: Fn) => {
  for (let i = obj.length - 1; i >= 0; i--) {
    fn(obj[i])
  }
}

describe('Seele', () => {
  const seele = Seele()

  const Position = seele.defineComponent(() => ({ x: 0, y: 0 }))
  const WalkVector = seele.defineComponent(() => ({ x: 10, y: 10 }))
  const SwimVector = seele.defineComponent(() => ({ x: 5, y: 5 }))
  const Pet = seele.defineComponent()

  describe('defineComponent', () => {
    it('works', () => {
      expect([Position, WalkVector, SwimVector, Pet]).toEqual([1, 2, 3, 4])
    })
  })

  const Cat = seele.defineEntity(entity => {
    entity.addComponent(Position)
      .addComponent(WalkVector)
      .addComponent(Pet)
  })

  const Fish = seele.defineEntity(entity => {
    entity.addComponent(Position)
      .addComponent(SwimVector)
      .addComponent(Pet)
  })

  describe('defineEntity & hasComponent', () => {
    it('cat has right components', () => {
      expect(Cat.hasComponent(Position)).toBeTruthy()
      expect(Cat.hasComponent(WalkVector)).toBeTruthy()
      expect(Cat.hasComponent(SwimVector)).toBeFalsy()
      expect(Cat.hasComponent(Pet)).toBeTruthy()
    })

    it('fish has right components', () => {
      expect(Fish.hasComponent(Position)).toBeTruthy()
      expect(Fish.hasComponent(WalkVector)).toBeFalsy()
      expect(Fish.hasComponent(SwimVector)).toBeTruthy()
      expect(Fish.hasComponent(Pet)).toBeTruthy()
    })
  })

  const neko = seele.createEntity(Cat)
  const sakana = seele.createEntity(Fish)

  describe('createEntity', () => {
    it('now we have neko and sakana', () => {
      expect(seele.hasEntity(neko)).toBeTruthy()
      expect(seele.hasEntity(sakana)).toBeTruthy()
    })

    it('but no ayaya', () => {
      const ayaya = 999 /* a random entityID */

      expect(seele.hasEntity(ayaya)).toBeFalsy()
    })
  })

  type Position = { x: -1, y: -1 }

  const testResults = {
    creatureCount: [] as number[],
    catPosition: [] as Position[],
    fishPosition: [] as Position[],
    birdPosition: [] as Position[],
  }

  const CreatureCountSystem = seele.defineSystem(() => {
    return {
      query: q => q.every(Pet),
      update: (archetypes) => {
        let count = 0
        traverse(archetypes, archetype => {
          count += archetype.entities.length
        })

        testResults.creatureCount.push(count)
      },
      type: ARCHETYPE_SYSTEM,
    }
  })

  const WalkSystem = seele.defineSystem(() => {
    return {
      query: q => q.every(Position, WalkVector, Pet), // what ???
      update: (entities) => {
        traverse(entities, entity => {
          entity[Position].x += entity[WalkVector].x
          entity[Position].y += entity[WalkVector].y

          testResults.catPosition.push({...entity[Position]})
        })
      }
    }
  })

  const SwimSystem = seele.defineSystem(() => {
    return {
      query: q => q.every(Position, SwimVector),
      update: (entities) => {
        traverse(entities, entity => {
          entity[Position].x += entity[SwimVector].x
          entity[Position].y += entity[SwimVector].y

          testResults.fishPosition.push({...entity[Position]})
        })
      }
    }
  })

  seele.registerSystem(CreatureCountSystem)
  seele.registerSystem(WalkSystem)
  seele.registerSystem(SwimSystem)

  seele.init()
  seele.update(1)

  describe('seele works', () => {
    const frame = 0
    it('archetype system works. and 2 entities exist: neko and sakana', () => {
      expect(testResults.creatureCount[frame]).toBe(2)
    })

    it('cat move', () => {
      expect(testResults.catPosition[frame]).toEqual({ x: 10, y: 10 })
    })

    it('fish move', () => {
      expect(testResults.fishPosition[frame]).toEqual({ x: 5, y: 5 })
    })
  })

  describe('system works after init', () => {
    const FlyVector = seele.defineComponent(() => ({ x: 20, y: 20 }))
    const Bird = seele.defineEntity(entity => {
      entity.addComponent(Position)
        .addComponent(FlyVector)
        .addComponent(Pet)
    })

    seele.createEntity(Bird)
    seele.createEntity(Bird)
    const bird = seele.createEntity(Bird)

    const FlySystem = seele.defineSystem(() => {
      return {
        query: q => q.every(Position, FlyVector),
        update: (entities) => {
          traverse(entities, entity => {
            entity[Position].x += entity[FlyVector].x
            entity[Position].y += entity[FlyVector].y

            testResults.birdPosition.push({...entity[Position]})
          })
        }
      }
    })

    seele.registerSystem(FlySystem)
    seele.update(1)

    const frame = 1
    it('now we have neko, sakana and 3 birds', () => {
      expect(testResults.creatureCount[frame]).toBe(5)
    })

    it('cat move twice', () => {
      expect(testResults.catPosition[frame]).toEqual({ x: 20, y: 20 })
    })

    it('fish move twice', () => {
      expect(testResults.fishPosition[frame]).toEqual({ x: 10, y: 10 })
    })

    it('fly move twice', () => {
      expect(testResults.birdPosition[frame]).toEqual({ x: 20, y: 20 })
    })

    it ('removeEntity works', () => {
      seele.removeEntity(bird)
      seele.update(1)
      const frame = 2

      expect(testResults.creatureCount[frame]).toBe(4)
    })
  })
})
