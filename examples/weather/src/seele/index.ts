import seele from './seele'
import { Creature } from './entities'
import { WeatherSystem, MovementSystem, FreezeSystem, CollisionDetectSystem, CreatureRendererSystem, StatisticSystem } from './systems'

seele.registerSystem(WeatherSystem)
seele.registerSystem(FreezeSystem)
seele.registerSystem(MovementSystem)
seele.registerSystem(CollisionDetectSystem)
seele.registerSystem(CreatureRendererSystem)
seele.registerSystem(StatisticSystem)

seele.init()

for (let i = 0; i < 1000; i++) {
  seele.createEntity(Creature)
}

const times = 1440
let count = 0
const update = () => {
  requestAnimationFrame(() => {
    seele.update()

    if (count++ < times) {
      update()
    }
  })
}

update()
