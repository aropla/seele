export type ComponentID = number
export type ComponentProps = any
export type ComponentCtor = any
export type EntityID = number
export type EntityInstance = any
export type ComponentInstance = any

/**
 * Archetype 的 ID
 *
 * 默认情况下由构成该 archetype 的 ComponentID[] 的 mask.toString() 获得
 */
export type ArchetypeID = string
