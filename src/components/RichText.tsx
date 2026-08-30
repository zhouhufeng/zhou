interface Props {
  html: string
  className?: string
}

/**
 * Renders a body extracted from zhouhufeng.github.io.
 *
 * Safe by construction rather than by trust: extract_content.py strips the HTML
 * to a small tag whitelist with only href/target/rel surviving, and the result
 * is baked into the bundle at build time — nothing is fetched at runtime.
 */
export default function RichText({ html, className = '' }: Props) {
  if (!html) return null
  return <div className={`rich ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
}
