/**
 * Drain every page of an AppSync list query.
 *
 * DynamoDB applies `limit` to the raw scan BEFORE any filter runs, and returns
 * at most one page per call — so a single list* call silently truncates once
 * the table outgrows a page. Every whole-table list must loop nextToken.
 * (This trap already fired on the student lesson page — see commit d3e37ae.)
 *
 * The query must declare `$nextToken: String`, pass it to the list field, and
 * select `nextToken` alongside `items`.
 */
export async function fetchAllPages<T = any>(
  client: { graphql: (opts: { query: string; variables?: Record<string, unknown> }) => unknown },
  query: string,
  listField: string,
  variables: Record<string, unknown> = {},
): Promise<T[]> {
  const items: T[] = []
  let nextToken: string | null = null
  do {
    const res = (await client.graphql({ query, variables: { ...variables, nextToken } })) as any
    const page = res?.data?.[listField]
    if (page?.items) items.push(...page.items)
    nextToken = page?.nextToken ?? null
  } while (nextToken)
  return items
}
