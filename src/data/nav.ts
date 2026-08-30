export interface NavItem {
  label: string
  to: string
  /** Grouped dropdown children, as on the source site's Research menu. */
  groups?: { label: string; items: { label: string; to: string }[] }[]
}

export const nav: NavItem[] = [
  { label: 'About', to: '/about' },
  { label: 'Publications', to: '/publications' },
  {
    label: 'Research',
    to: '/research',
    groups: [
      {
        label: 'Population genetics',
        items: [
          { label: 'Overview', to: '/research/population-genetics' },
          { label: 'FAVOR', to: '/research/favor' },
          { label: 'STAAR', to: '/research/staar' },
        ],
      },
      {
        label: 'Epigenomics',
        items: [
          { label: 'Overview', to: '/research/epigenomics' },
          { label: 'EBV oncoproteins', to: '/research/ebv-oncoproteins' },
          { label: 'Super enhancers', to: '/research/super-enhancers' },
          { label: 'EBV regulome', to: '/research/ebv-regulome' },
        ],
      },
      {
        label: 'Protein interactions',
        items: [
          { label: 'Overview', to: '/research/protein-interactions' },
          { label: 'Intra-species PPIs', to: '/research/intra-species-ppis' },
          { label: 'Host-pathogen PPIs', to: '/research/host-pathogen-ppis' },
          { label: 'Protein functions', to: '/research/protein-functions' },
        ],
      },
      {
        label: 'AI and translation',
        items: [{ label: 'AI genomics and pathology', to: '/research/ai-genomics' }],
      },
    ],
  },
  { label: 'Software', to: '/software' },
  { label: 'Contact', to: '/contact' },
]

/** Every route the site serves — drives the sitemap. */
export const allRoutes: string[] = [
  '/',
  ...nav.flatMap((n) => [n.to, ...(n.groups ?? []).flatMap((g) => g.items.map((i) => i.to))]),
]
