import { Mask } from '@/utils/BitSet'
import { isFunction } from '@/utils'
import type { BitSet } from '@/utils/BitSet'
import type { Archetype } from '@/Archetype'

export const queryAll = (q: QueryBuilder) => q.custom(() => true)
export const queryNone = (q: QueryBuilder) => q.custom(() => false)

export type RawQuery = (q: QueryBuilder) => QueryBuilder

export type QueryMatcher = (mask: BitSet, archetype: Archetype) => boolean
export type QueryBuilder = {
  matchers: QueryMatcher[]
  or: (queryBuilder: (queryBuilder: QueryBuilder) => QueryBuilder) => QueryBuilder
  every: (...components: number[]) => QueryBuilder
  some: (...components: number[]) => QueryBuilder
  not: (...components: number[]) => QueryBuilder
  none: (...components: number[]) => QueryBuilder
  entity: (archetype: Archetype) => QueryBuilder
  custom: (matcher: QueryMatcher) => QueryBuilder
}
export type Query = {
  archetypes: Archetype[]
  tryAdd: (archetype: Archetype) => boolean
}

function makeAndMatcher(matcher: QueryMatcher, matchers: QueryMatcher[]): QueryMatcher {
  return (mask, archetype) => matcher(mask, archetype) && matchers.every(matcher => matcher(mask, archetype))
}

function makeOrMatcher(matcher: QueryMatcher, matchers: QueryMatcher[]): QueryMatcher {
  return (mask, archetype) => matcher(mask, archetype) || matchers.some(matcher => matcher(mask, archetype))
}

const alwaysTrue: QueryMatcher = () => true

function QueryBuilder(): QueryBuilder {
  let matchers: QueryMatcher[] = []

  return {
    matchers,
    or(cb) {
      const [first = alwaysTrue, ...rest] = matchers

      matchers = [
        makeOrMatcher(
          makeAndMatcher(first, rest),
          cb(QueryBuilder()).matchers,
        )
      ]

      return this
    },
    every(...components) {
      if (components.length === 0) {
        return this
      }

      const mask = Mask(components)
      matchers.push((other: BitSet) => other.contains(mask))

      return this
    },
    some(...components) {
      if (components.length === 0) {
        return this
      }

      const mask = Mask(components)
      matchers.push((other: BitSet) => other.intersects(mask))

      return this
    },
    not(...components) {
      if (components.length === 0) {
        return this
      }

      const mask = Mask(components)
      matchers.push((other: BitSet) => !other.intersects(mask))

      return this
    },
    none(...components) {
      if (components.length === 0) {
        return this
      }

      const mask = Mask(components)
      matchers.push((other: BitSet) => !other.contains(mask))

      return this
    },
    entity(archetype) {
      matchers.push((other: BitSet) => other.contains(archetype.mask))

      return this
    },
    custom(matcher) {
      matchers.push(matcher)

      return this
    },
  }
}

function toQuery(queryBuilder: QueryBuilder): Query {
  const archetypes: Archetype[] = []

  const [first = alwaysTrue, ...rest] = queryBuilder.matchers
  const matcher = makeAndMatcher(first, rest)

  return {
    archetypes,
    tryAdd(archetype: Archetype) {
      if (!matcher(archetype.mask, archetype)) {
        return false
      }

      archetypes.push(archetype)

      return true
    }
  }
}

export type QueryManager = {
  queries: Query[]
  resolveQuery: (query: RawQuery | Query) => Query
}

export function QueryManager(): QueryManager {
  const queries: Query[] = []

  return {
    queries,
    resolveQuery(unknownQuery) {
      if (isFunction(unknownQuery)) {
        const query = toQuery((unknownQuery as RawQuery)(QueryBuilder()))
        queries.push(query)

        return query
      }

      return (unknownQuery as Query)
    }
  }
}
