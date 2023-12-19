import { BitSet } from '@/utils/BitSet'
import { log } from '@logger'
import { IS_DEV } from '@/env'

export type InstanceCreator = {
  create: () => EntityInstance
}

function InstanceCreator(instanceMag: InstanceManager, mask: BitSet): InstanceCreator {
  const compose = (instanceMag: InstanceManager, mask: BitSet) => {
    const componentIDs = mask.values()
    const ctors = componentIDs.map(instanceMag.get)

    const create = () => {
      const instance = Object.create(null)

      for (let i = 0; i < componentIDs.length; i++) {
        const Component = componentIDs[i]
        const ctor = ctors[i]

        instance[Component] = ctor()
      }

      return instance
    }

    return create
  }

  return {
    create: compose(instanceMag, mask),
  }
}

export type InstanceManager = {
  get: (componentID: ComponentID) => ComponentCtor
  has: (componentID: ComponentID) => boolean
  register: (componentID: ComponentID, ctor: ComponentCtor) => void
  Creator: (mask: BitSet) => InstanceCreator
}

export function InstanceManager(): InstanceManager {
  const ctorMap = new Map

  function get(componentID: ComponentID) {
    return ctorMap.get(componentID)
  }

  return {
    get,
    has(componentID) {
      return get(componentID) === undefined
    },
    register(componentID, ctor) {
      if (IS_DEV) {
        log(`[success]-[register component constructor]: ${componentID}`)
      }

      ctorMap.set(componentID, ctor)
    },
    Creator(mask: BitSet) {
      return InstanceCreator(this, mask)
    },
  }
}
