import { Query, RawQuery, QueryManager } from '@/Query'
import { Archetype } from '@/Archetype'

type ENTITY_SYSTEM = 0
type ARCHETYPE_SYSTEM = 1

export type SystemType = ENTITY_SYSTEM | ARCHETYPE_SYSTEM

export const ENTITY_SYSTEM = 0
export const ARCHETYPE_SYSTEM = 1

export type EntityUpdate = (entities: EntityInstance[], delta: number) => void
export type ArchetypeUpdate = (archetypes: Archetype[], delta: number) => void
export type SystemUpdate = EntityUpdate | ArchetypeUpdate

export type RawSystem<T = Record<string, unknown>> = ({
  id?: number
  name?: string
  query: Query | RawQuery
  type?: ENTITY_SYSTEM
  update: EntityUpdate
} | {
  id?: number
  name?: string
  query: Query | RawQuery
  type: ARCHETYPE_SYSTEM
  custom?: T
  update: ArchetypeUpdate
}) & T

export type System<T = Record<string, unknown>> = ({
  id: number
  name: string
  query: Query
  type: ENTITY_SYSTEM | undefined
  update: EntityUpdate
} | {
  id: number
  name: string
  query: Query
  type: ARCHETYPE_SYSTEM
  update: ArchetypeUpdate
}) & T

export function System<T = Record<string, unknown>>(rawSystem: RawSystem<T>, queryManager: QueryManager): System<T> {
  const query = queryManager.resolveQuery(rawSystem.query)

  return {
    id: rawSystem.id as number,
    name: rawSystem.name ?? 'anonymous',
    update: rawSystem.update,
    query,
    type: rawSystem.type ?? ENTITY_SYSTEM,
  }
}
