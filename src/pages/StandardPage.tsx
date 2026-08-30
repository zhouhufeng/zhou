import { PageHero } from '../components/Hero'
import SectionBlock from '../components/SectionBlock'
import type { Page } from '../data/content'

/** Every page whose body is just extracted sections. */
export default function StandardPage({ page }: { page: Page }) {
  return (
    <>
      <PageHero page={page} />
      {page.sections.map((s, i) => (
        <SectionBlock key={i} section={s} />
      ))}
    </>
  )
}
