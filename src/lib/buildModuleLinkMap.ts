import { getAllContent, CONTENT_TYPES } from '@/lib/content'
import type { Language, ContentItem } from '@/lib/content'

export interface ArticleLink {
  url: string
  title: string
}

export type ModuleLinkMap = Record<string, ArticleLink | null>

interface ArticleWithType extends ContentItem {
  contentType: string
}

// 嵌套数组配置（用于 itemsTierList.tiers[].entries[] 这类两层结构）
interface NestedFieldConfig {
  field: string
  nameKey: string
}

// Module sub-field mapping: moduleKey -> { field, nameKey, nested? }
// field: 外层数组字段名；nameKey: 外层元素里取"名称"的字段；
// nested: 可选的第二层数组（如 tiers[].entries[]），生成 `${module}::${field}::${i}::${nested.field}::${j}` 形式的 key
interface FieldConfig {
  field: string
  nameKey: string
  nested?: NestedFieldConfig
}

const MODULE_FIELDS: Record<string, FieldConfig> = {
  beginnerGuide: { field: 'steps', nameKey: 'title' },
  itemsTierList: {
    field: 'tiers',
    nameKey: 'label',
    nested: { field: 'entries', nameKey: 'name' },
  },
  mapsShortcuts: { field: 'routes', nameKey: 'name' },
  multiplayerGuide: { field: 'steps', nameKey: 'title' },
  controlsGuide: { field: 'sections', nameKey: 'name' },
  releasePlatforms: { field: 'platforms', nameKey: 'platform' },
  achievements: { field: 'categories', nameKey: 'category' },
  updatesPatchNotes: { field: 'updates', nameKey: 'headline' },
}

// Extra semantic keywords per module to boost matching for h2 titles
// These supplement the module title text when matching against articles
const MODULE_EXTRA_KEYWORDS: Record<string, string[]> = {
  beginnerGuide: ['beginner', 'starter', 'tips', 'controls', 'swing', 'settings'],
  itemsTierList: ['items', 'weapons', 'best items', 'railgun', 'laser', 'disarm', 'landmine'],
  mapsShortcuts: ['maps', 'courses', 'shortcuts', 'holes', 'routes', 'city', 'forest', 'desert', 'coast', 'snow'],
  multiplayerGuide: ['multiplayer', 'team mode', 'crossplay', 'lobby', 'teams', 'solo'],
  controlsGuide: ['controls', 'settings', 'swing', 'aim', 'best settings'],
  releasePlatforms: ['steam', 'console', 'platform', 'system requirements', 'release', 'xbox', 'switch', 'ps5', 'price'],
  achievements: ['achievements', '100%', 'hidden achievement', 'completion', 'rocket driver', 'frog legs'],
  updatesPatchNotes: ['update', 'patch notes', 'attack on city', 'frozen fairway', 'new content', 'balance'],
}

const FILLER_WORDS = [
  'super', 'battle', 'golf', 'wiki', '2026', '2025', 'complete', 'the', 'and', 'for',
  'how', 'with', 'our', 'this', 'your', 'all', 'from', 'learn', 'master',
]

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getSignificantTokens(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter(w => w.length > 2 && !FILLER_WORDS.includes(w))
}

function matchScore(queryText: string, article: ArticleWithType, extraKeywords?: string[]): number {
  const normalizedQuery = normalize(queryText)
  const normalizedTitle = normalize(article.frontmatter.title)
  const normalizedDesc = normalize(article.frontmatter.description || '')
  const normalizedSlug = article.slug.replace(/-/g, ' ').toLowerCase()

  let score = 0

  // Exact phrase match in title (stripped of "Super Battle Golf" brand prefix)
  const strippedQuery = normalizedQuery.replace(/super battle golf\s*/g, '').trim()
  const strippedTitle = normalizedTitle.replace(/super battle golf\s*/g, '').trim()
  if (strippedQuery.length > 3 && strippedTitle.includes(strippedQuery)) {
    score += 100
  }

  // Token overlap from query text
  const queryTokens = getSignificantTokens(queryText)
  for (const token of queryTokens) {
    if (normalizedTitle.includes(token)) score += 20
    if (normalizedDesc.includes(token)) score += 5
    if (normalizedSlug.includes(token)) score += 15
  }

  // Extra keywords scoring (for module h2 titles)
  if (extraKeywords) {
    for (const kw of extraKeywords) {
      const normalizedKw = normalize(kw)
      if (normalizedKw.length === 0) continue
      if (normalizedTitle.includes(normalizedKw)) score += 15
      if (normalizedDesc.includes(normalizedKw)) score += 5
      if (normalizedSlug.includes(normalizedKw)) score += 10
    }
  }

  return score
}

function findBestMatch(
  queryText: string,
  articles: ArticleWithType[],
  extraKeywords?: string[],
  threshold = 20,
): ArticleLink | null {
  let bestScore = 0
  let bestArticle: ArticleWithType | null = null

  for (const article of articles) {
    const score = matchScore(queryText, article, extraKeywords)
    if (score > bestScore) {
      bestScore = score
      bestArticle = article
    }
  }

  if (bestScore >= threshold && bestArticle) {
    return {
      url: `/${bestArticle.contentType}/${bestArticle.slug}`,
      title: bestArticle.frontmatter.title,
    }
  }

  return null
}

export async function buildModuleLinkMap(locale: Language): Promise<ModuleLinkMap> {
  // 1. Load all articles across all content types
  const allArticles: ArticleWithType[] = []
  for (const contentType of CONTENT_TYPES) {
    const items = await getAllContent(contentType, locale)
    for (const item of items) {
      allArticles.push({ ...item, contentType })
    }
  }

  // 2. Load module data from en.json (use English for keyword matching)
  const enMessages = (await import('../locales/en.json')).default as any

  const linkMap: ModuleLinkMap = {}

  // 3. For each module, match h2 title and sub-items (including nested arrays)
  for (const [moduleKey, fieldConfig] of Object.entries(MODULE_FIELDS)) {
    const moduleData = enMessages.modules?.[moduleKey]
    if (!moduleData) continue

    // Match module h2 title (use extra keywords + lower threshold for broader matching)
    const moduleTitle = moduleData.title as string
    if (moduleTitle) {
      const extraKw = MODULE_EXTRA_KEYWORDS[moduleKey] || []
      linkMap[moduleKey] = findBestMatch(moduleTitle, allArticles, extraKw, 15)
    }

    // Match sub-items (outer array)
    const subItems = moduleData[fieldConfig.field] as any[]
    if (Array.isArray(subItems)) {
      for (let i = 0; i < subItems.length; i++) {
        const itemName = subItems[i]?.[fieldConfig.nameKey] as string
        if (itemName) {
          linkMap[`${moduleKey}::${fieldConfig.field}::${i}`] = findBestMatch(itemName, allArticles)
        }

        // Match nested sub-items (e.g. tiers[].entries[])
        const nested = fieldConfig.nested
        if (nested) {
          const nestedItems = subItems[i]?.[nested.field]
          if (Array.isArray(nestedItems)) {
            for (let j = 0; j < nestedItems.length; j++) {
              const nestedName = nestedItems[j]?.[nested.nameKey] as string
              if (nestedName) {
                linkMap[`${moduleKey}::${fieldConfig.field}::${i}::${nested.field}::${j}`] = findBestMatch(
                  nestedName,
                  allArticles,
                )
              }
            }
          }
        }
      }
    }
  }

  return linkMap
}
