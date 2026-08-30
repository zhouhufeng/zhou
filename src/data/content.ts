import raw from '../../data/content.json'

export interface Link {
  label: string
  href: string
}

export interface Card {
  title: string
  image: string | null
  imageAlt: string
  /** Sanitised HTML — see scripts/extract_content.py. */
  html: string
  href: string
  linkLabel: string
}

export interface Stat {
  value: string
  label: string
}

export interface Publication {
  year: string
  title: string
  authors: string
  venue: string
  doi: string
  pubmed: string
  highlight: boolean
  /** From OpenAlex; absent when the work could not be matched. */
  citedBy?: number
}

export interface Section {
  kicker: string
  heading: string
  lede: string
  tags: string[]
  alt: boolean
  html?: string
  prose: string
  cards: Card[]
  stats: Stat[]
  publications: Publication[]
  actions: Link[]
  image: string | null
  imageAlt: string
}

export interface Page {
  route: string
  kicker: string
  title: string
  lede: string
  heroActions: Link[]
  heroStats: Stat[]
  heroImage: string
  sections: Section[]
}

interface Content {
  site: {
    name: string
    shortName: string
    discipline: string
    role: string
    email: string
    cv: string
    links: Record<string, string>
  }
  metrics: {
    works: number
    citedBy: number
    hIndex: number
    i10Index: number
    updated: string
    source: string
    sourceUrl: string
  }
  pages: Record<string, Page>
  publications: Publication[]
}

export const content = raw as unknown as Content
export const site = content.site
export const metrics = content.metrics

/** Route -> page, so the router can look a page up by URL. */
export const pagesByRoute: Record<string, Page> = Object.fromEntries(
  Object.values(content.pages).map((p) => [p.route, p]),
)
