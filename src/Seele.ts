import { IDGenerator, isNumber } from '@/utils'
import { log, error } from '@logger'
import { Archetype, ArchetypeManager, ArchetypeBuilder } from '@/Archetype'
import { InstanceManager } from '@/Instance'
import { System, RawSystem, ENTITY_SYSTEM, ARCHETYPE_SYSTEM } from '@/System'
import { IS_DEV } from '@/env'
import { ID } from '@/Components'
import { QueryManager, Query, QueryBuilder, queryAll, queryNone } from '@/Query'
import { Looper, LooperOptions } from '@/Looper'

export { ENTITY_SYSTEM, ARCHETYPE_SYSTEM }
export { ID }
export { queryAll, queryNone }

export type LoopInfo = any
export type { Query, QueryBuilder }
export type Seele = {
  defineComponent: <T = unknown>(ctor?: T | (() => T)) => ComponentID
  hasComponent: (entityID: EntityID | EntityInstance, componentID: ComponentID) => boolean
  addComponent: (entityID: EntityID | EntityInstance, componentID: ComponentID, props?: ComponentProps) => void
  removeComponent: (entityID: EntityID | EntityInstance, componentID: ComponentID) => void
  hasEntity: (entityID: EntityID | EntityInstance) => boolean
  defineEntity: (cb?: (archetypeBuilder: ArchetypeBuilder) => void) => Archetype
  createEntity: (maskContainer: ArchetypeBuilder | Archetype, setter?: (entity: EntityInstance) => void) => EntityID
  removeEntity: (entityID: EntityID | EntityInstance) => void
  defineSystem: (rawSystemCtor: () => RawSystem) => System
  registerSystem: (system: System) => Seele
  defineQuery: (rawQuery: (q: QueryBuilder) => QueryBuilder) => Query
  defer: (fn: () => void) => void
  update: (delta: DOMHighResTimeStamp) => void
  init: () => void
} & {
  archetypeMag: ArchetypeManager
} & Looper

function getEntityID(entityID: EntityID | EntityInstance): number {
  return entityID[ID] ?? entityID
}

export function Seele(options: LooperOptions = {}): Seele {
  const looper = Looper(options)
  const componentIDGen = IDGenerator(1)
  const entityIDGen = IDGenerator(1)
  const systemIDGen = IDGenerator(1)

  const instanceMag = InstanceManager()
  const archetypeMag = ArchetypeManager(instanceMag)
  const queryMag = QueryManager()

  const entityArchetype: Archetype[] | undefined[] = []
  const systems: System[] = []
  const deferred: (() => void)[] = []

  let inited = false

  function update(delta: DOMHighResTimeStamp) {
    systems.forEach(system => {
      const archetypes = system.query.archetypes

      if (system.type === ARCHETYPE_SYSTEM) {
        system.update(archetypes, delta)
      } else {
        for (let i = archetypes.length - 1; i >= 0; i--) {
          const entities = archetypes[i].entities
          system.update(entities, delta)
        }
      }
    })

    if (deferred.length !== 0) {
      deferred.forEach(fn => fn())
      deferred.length = 0
    }
  }

  function tryAddArchetypeToQueries(archetype: Archetype) {
    archetype.inited = true

    const queries = queryMag.queries
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i]
      query.tryAdd(archetype)
    }
  }

  function hasEntity(entityID: EntityID) {
    entityID = getEntityID(entityID)

    return entityArchetype[entityID] !== undefined
  }

  function getComponentCtor(componentID: ComponentID) {
    return instanceMag.get(componentID)
  }

  function transformEntityForComponent(archetype: Archetype, entityID: EntityID, componentID: ComponentID) {
    const entity = archetype.removeEntity(entityID)

    const nextArchetype = archetypeMag.transform(archetype, componentID)

    if (!nextArchetype.inited) {
      tryAddArchetypeToQueries(nextArchetype)
    }

    nextArchetype.addEntity(entityID, entity)
    entityArchetype[entityID] = nextArchetype

    return entity
  }

  return {
    archetypeMag,

    hasComponent(entityID, componentID) {
      entityID = getEntityID(entityID)
      const archetype = entityArchetype[entityID]

      if (archetype === undefined) {
        return false
      }

      return archetype.hasComponent(componentID)
    },

    addComponent(entityID, componentID, setter) {
      entityID = getEntityID(entityID)
      if (!hasEntity(entityID)) {
        error(`[error]-[addComponent]: entity ${entityID} does not exist.`)

        return
      }

      const archetype = entityArchetype[entityID]

      if (archetype === undefined) {
        error(`[error]-[addComponent]: entity ${entityID} does not exist.`)

        return
      }

      if (!archetype.hasComponent(componentID)) {
        const entity = transformEntityForComponent(archetype, entityID, componentID)
        const component = getComponentCtor(componentID)()
        entity[componentID] = setter ? setter(component) : component
      }
    },

    removeComponent(entityID, componentID) {
      entityID = getEntityID(entityID)
      if (!hasEntity(entityID)) {
        error(`[error]-[removeComponent]: entity ${entityID} does not exist.`)

        return
      }

      const archetype = entityArchetype[entityID]

      if (archetype === undefined) {
        error(`[error]-[removeComponent]: entity ${entityID} does not exist.`)

        return
      }

      if (archetype.hasComponent(componentID)) {
        const entity = transformEntityForComponent(archetype, entityID, componentID)
        entity[componentID] = undefined
      }
    },

    defineComponent<T = unknown>(componentCtor?: T | (() => T)): ComponentID {
      const componentID = componentIDGen.next()
      const ctor = typeof componentCtor !== 'function' ? () => componentCtor : componentCtor
      instanceMag.register(componentID, ctor)

      return componentID
    },

    hasEntity,

    defineEntity(cb) {
      const archetypeBuilder = ArchetypeBuilder()
      cb && cb(archetypeBuilder)

      const archetype = archetypeMag.create(archetypeBuilder.mask)

      if (inited) {
        tryAddArchetypeToQueries(archetype)
      }

      return archetype
    },

    createEntity(maskContainer, setter) {
      const entityID = entityIDGen.next()

      // if mask does not exist, create it.
      // 'archetypeMag.create' it self can get mask
      const archetype = archetypeMag.create(maskContainer.mask)
      const entity = archetype.addEntity(entityID)
      entityArchetype[entityID] = archetype

      setter && setter(entity)

      return entityID
    },

    removeEntity(entityID) {
      entityID = getEntityID(entityID)
      const archetype = entityArchetype[entityID]

      if (!archetype) {
        return
      }

      archetype.removeEntity(entityID)
      entityArchetype[entityID] = undefined
      entityIDGen.recycle(entityID)
    },

    defineSystem(rawSystemCtor) {
      const rawSystem = rawSystemCtor() as System

      if (!isNumber(rawSystem.id)) {
        rawSystem.id = systemIDGen.next()
      }

      return System(rawSystem, queryMag)
    },

    registerSystem(system) {
      if (IS_DEV) {
        log(`[success]-[register system]: ${system.name}`)
      }

      systems.push(system)

      if (inited) {
        archetypeMag.traverse(system.query.tryAdd)
      }

      return this
    },

    defineQuery(rawQuery) {
      const query = queryMag.resolveQuery(rawQuery)

      if (inited) {
        archetypeMag.traverse(query.tryAdd)
      }

      return query
    },

    defer(fn) {
      deferred.push(fn)
    },

    init() {
      if (inited) {
        return
      }

      looper.setUpdate(update)
      looper.setAfterUpdate((_fps, panic) => {
        if (panic) {
          looper.resetFrameDelta()
        }
      })

      inited = true
      archetypeMag.traverse(tryAddArchetypeToQueries)
    },

    update,
    ...looper,
  }
}
