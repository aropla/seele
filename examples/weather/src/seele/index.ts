import seele from './seele'
import { Creature } from './entities'
import { WeatherSystem, MovementSystem, FreezeSystem, CollisionDetectSystem, CreatureRendererSystem, StatisticSystem } from './systems'
import { fps } from '../data'

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

seele.setAfterUpdate((f, panic) => {
  fps.value = Math.round(f)

  if (f < 30 || panic) {
    seele.resetFrameDelta()
  }
})

seele.start()
