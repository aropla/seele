import { Query, RawQuery, QueryManager } from '@/Query'
import { Archetype } from '@/Archetype'
import type { Seele } from '@/Seele'

type ENTITY_SYSTEM = 0
type ARCHETYPE_SYSTEM = 1

export type SystemType = ENTITY_SYSTEM | ARCHETYPE_SYSTEM

export const ENTITY_SYSTEM = 0
export const ARCHETYPE_SYSTEM = 1

export type RawSystem = {
  name?: string
  query: Query | RawQuery
  type?: ENTITY_SYSTEM
  update: (entities: EntityInstance[], seele: Seele, args: unknown) => void
} | {
  name?: string
  query: Query | RawQuery
  type: ARCHETYPE_SYSTEM
  update: (archetypes: Archetype[], seele: Seele, args: unknown) => void
}

export type System = {
  name: string
  query: Query
  type: ENTITY_SYSTEM | undefined
  update: (entities: EntityInstance[], seele: Seele, args: unknown) => void
} | {
  name: string
  query: Query
  type: ARCHETYPE_SYSTEM
  update: (archetypes: Archetype[], seele: Seele, args: unknown) => void
}

export function System(rawSystem: () => RawSystem, queryManager: QueryManager): System {
  const system = rawSystem()
  const query = queryManager.resolveQuery(system.query)

  return {
    name: system.name ?? 'anonymous',
    update: system.update,
    query,
    type: system.type ?? ENTITY_SYSTEM,
  }
}
