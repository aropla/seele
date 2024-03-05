import { BitSet, Mask } from '@/utils/BitSet'
import { InstanceManager, InstanceCreator } from '@/Instance'
import { SparseSet } from '@/utils/SparseSet'
import { ID } from '@/Components'
import { ArchetypeID, ComponentID, EntityID, EntityInstance } from './types'
import { ResolvedSaveData, SaveData } from '.'

export type Archetype = {
  id: string
  mask: BitSet
  entities: EntityInstance[]
  added: EntityInstance[]
  removed: EntityInstance[]
  inited: boolean
  size: number
  addEntity: (entityID: EntityID, entity?: EntityInstance) => EntityInstance
  removeEntity: (entityID: EntityID) => EntityInstance
  hasEntity: Set<number>['has']
  hasComponent: (componentID: ComponentID) => boolean
  addAdjacent: (componentID: ComponentID, archetype: Archetype) => void
  getAdjacent: (componentID: ComponentID) => Archetype
  traverse: (cb: Fn) => void
}

export function Archetype(id: string, mask: BitSet, creator: InstanceCreator): Archetype {
  const entitySet = SparseSet()
  const adjacent: Archetype[] = []
  const entities: EntityInstance[] = []
  const added: EntityInstance[] = []
  const removed: EntityInstance[] = []
  const inited = false

  return {
    id,
    mask,
    entities,
    added,
    removed,
    inited,
    get size() {
      return entities.length
    },
    hasEntity: entitySet.has,
    hasComponent(componentID: ComponentID) {
      return mask.has(componentID)
    },
    addEntity(entityID, entity) {
      const addedPosition = entitySet.add(entityID)
      entity = entity === undefined ? creator.create() : entity
      entities[addedPosition] = entity
      entity[ID] = entityID

      return entity
    },
    removeEntity(entityID) {
      const removedPosition = entitySet.remove(entityID)
      const removedEntity = entities[removedPosition]
      const lastEntity = entities.pop()

      if (removedPosition === entities.length) {
        return removedEntity
      }

      entities[removedPosition] = lastEntity

      return removedEntity
    },
    addAdjacent(componentID, archetype) {
      adjacent[componentID] = archetype
    },
    getAdjacent(componentID) {
      return adjacent[componentID]
    },
    traverse(cb) {
      const len = entities.length - 1
      for (let i = len; i >= 0; i--) {
        cb(entities[i])
      }
    },
  }
}

export type ArchetypeBuilder = {
  mask: BitSet
  addComponent: (component: ComponentID) => ArchetypeBuilder
  removeComponent: (component: ComponentID) => ArchetypeBuilder
  addEntity: (archetype: Archetype) => ArchetypeBuilder
}

export function ArchetypeBuilder(): ArchetypeBuilder {
  const mask = BitSet(8)

  return {
    mask,
    addComponent(componentID) {
      mask.or(componentID)

      return this
    },
    removeComponent(componentID) {
      if (mask.has(componentID)) {
        mask.xor(componentID)
      }

      return this
    },
    addEntity(archetype: Archetype) {
      const componentIDs = archetype.mask.values()

      componentIDs.forEach(componentID => {
        mask.or(componentID)
      })

      return this
    },
  }
}

export type ArchetypeManager = {
  archetypeMap: Map<ArchetypeID, Archetype>
  get: (archetypeID: ArchetypeID) => Archetype | undefined
  create: (mask: BitSet, archetypeID?: ArchetypeID) => Archetype
  transform: (archetype: Archetype, componentID: ComponentID) => Archetype
  traverse: (fn: (archetype: Archetype) => void) => void
  onSerialize: (archetype: Archetype) => SaveData
  onDeserialize: (saveData: SaveData) => ResolvedSaveData
}

export function ArchetypeManager(instanceMag: InstanceManager): ArchetypeManager {
  const archetypeMap = new Map<ArchetypeID, Archetype>()

  function create(mask: BitSet, archetypeID?: ArchetypeID): ReturnType<ArchetypeManager['create']> {
    if (!archetypeID) {
      archetypeID = mask.toString()
    }

    if (archetypeMap.has(archetypeID)) {
      return archetypeMap.get(archetypeID) as Archetype
    }

    const archetype = Archetype(archetypeID, mask, instanceMag.Creator(mask))
    archetypeMap.set(archetypeID, archetype)

    return archetype
  }

  return {
    archetypeMap,
    get: archetypeMap.get,
    create,
    transform(archetype, componentID) {
      const adjacent = archetype.getAdjacent(componentID)
      if (adjacent !== undefined) {
        return adjacent
      }

      const mask = archetype.mask
      mask.xor(componentID)
      const transformed = create(mask.clone())
      mask.xor(componentID)

      transformed.addAdjacent(componentID, archetype)
      archetype.addAdjacent(componentID, transformed)

      return transformed
    },
    traverse(fn) {
      for (const [, archetype] of archetypeMap) {
        fn(archetype)
      }
    },
    onSerialize(archetype: Archetype) {
      return {
        mask: archetype.mask.values(),
        entities: archetype.entities,
      }
    },
    onDeserialize(saveData: SaveData) {
      const mask = Mask(saveData.mask)

      return {
        builder: {
          mask,
        },
        entities: saveData.entities,
      }
    },
  }
}
