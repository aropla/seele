type Seele = any

type ComponentID = number
type ComponentProps = any
type ComponentCtor = any
type EntityID = number
type EntityInstance = any
type SeeleQuery = any

/**
 * Archetype 的 ID
 *
 * 默认情况下由构成该 archetype 的 ComponentID[] 的 mask.toString() 获得
 */
type ArchetypeID = string

type Fn = (...args: any) => any
