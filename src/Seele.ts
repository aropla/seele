import { IDGenerator } from '@/utils'
import { log, error } from '@logger'
import { Archetype, ArchetypeManager, ArchetypeBuilder } from '@/Archetype'
import { InstanceManager } from '@/Instance'
import { System, RawSystem, ENTITY_SYSTEM, ARCHETYPE_SYSTEM } from '@/System'
import { IS_DEV } from '@/env'
import { ID } from '@/Components'
import { QueryManager, Query, QueryBuilder } from '@/Query'

export { ENTITY_SYSTEM, ARCHETYPE_SYSTEM, ID }

export type Seele = {
  defineComponent: <T = unknown>(ctor?: T | (() => T)) => ComponentID
  hasComponent: (entityID: EntityID, componentID: ComponentID) => boolean
  addComponent: (entityID: EntityID, componentID: ComponentID, props?: ComponentProps) => void
  removeComponent: (entityID: EntityID, componentID: ComponentID) => void
  hasEntity: (entityID: EntityID) => boolean
  defineEntity: (cb?: (archetypeBuilder: ArchetypeBuilder) => void) => Archetype
  createEntity: (maskContainer: ArchetypeBuilder | Archetype) => EntityID
  removeEntity: (entityID: EntityID) => void
  defineSystem: (rawSystem: () => RawSystem) => System
  registerSystem: (system: System) => void
  defineQuery: (rawQuery: (q: QueryBuilder) => QueryBuilder) => Query
  defer: (fn: () => void) => void
  update: (args?: unknown) => void
  init: () => void
} & {
  archetypeMag: ArchetypeManager
}

export function Seele(): Seele {
  const componentIDGen = IDGenerator(1)
  const entityIDGen = IDGenerator(1)

  const instanceMag = InstanceManager()
  const archetypeMag = ArchetypeManager(instanceMag)
  const queryMag = QueryManager()

  const entityArchetype: Archetype[] | undefined[] = []
  const systems: System[] = []
  const deferred: (() => void)[] = []

  let inited = false

  function update(this: Seele, args?: unknown) {
    systems.forEach(system => {
      const archetypes = system.query.archetypes

      if (system.type === ARCHETYPE_SYSTEM) {
        system.update(archetypes, this, args)
      } else {
        for (let i = archetypes.length - 1; i >= 0; i--) {
          const entities = archetypes[i].entities
          system.update(entities, this, args)
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
      const archetype = entityArchetype[entityID]

      if (archetype === undefined) {
        return false
      }

      return archetype.hasComponent(componentID)
    },

    addComponent(entityID, componentID) {
      if (!hasEntity(entityID)) {
        error(`[error]-[addComponent]: ${entityID} does not exist.`)

        return
      }

      const archetype = entityArchetype[entityID]

      if (archetype === undefined) {
        error(`[error]-[addComponent]: ${entityID} does not exist.`)

        return
      }

      if (!archetype.hasComponent(componentID)) {
        const entity = transformEntityForComponent(archetype, entityID, componentID)
        entity[componentID] = getComponentCtor(componentID)()
      }
    },

    removeComponent(entityID, componentID) {
      if (!hasEntity(entityID)) {
        error(`[error]-[removeComponent]: ${entityID} does not exist.`)

        return
      }

      const archetype = entityArchetype[entityID]

      if (archetype === undefined) {
        error(`[error]-[removeComponent]: ${entityID} does not exist.`)

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

    createEntity(maskContainer) {
      const entityID = entityIDGen.next()

      // if mask does not exist, create it.
      // 'archetypeMag.create' it self can get mask
      const archetype = archetypeMag.create(maskContainer.mask)
      archetype.addEntity(entityID)
      entityArchetype[entityID] = archetype

      return entityID
    },

    removeEntity(entityID) {
      const archetype = entityArchetype[entityID]

      if (!archetype) {
        return
      }

      archetype.removeEntity(entityID)
      entityArchetype[entityID] = undefined
      entityIDGen.recycle(entityID)
    },

    defineSystem(rawSystem) {
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

      inited = true
      archetypeMag.traverse(tryAddArchetypeToQueries)
    },

    update,
  }
}
