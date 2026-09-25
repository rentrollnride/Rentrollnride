import { useEffect } from "react"

const SITE_URL = "https://rentridenroll.org"

export function Seo({ title, description, path = "/", noIndex = false }: {
  title: string
  description: string
  path?: string
  noIndex?: boolean
}) {
  useEffect(() => {
    const url = `${SITE_URL}${path === "/" ? "" : path}`
    document.title = title
    setMeta("name", "description", description)
    setMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow")
    setMeta("property", "og:title", title)
    setMeta("property", "og:description", description)
    setMeta("property", "og:url", url)
    setMeta("name", "twitter:title", title)
    setMeta("name", "twitter:description", description)
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]') ?? document.createElement("link")
    canonical.rel = "canonical"
    canonical.href = url
    if (!canonical.parentNode) document.head.appendChild(canonical)
  }, [description, noIndex, path, title])

  return null
}

function setMeta(attribute: "name" | "property", key: string, content: string) {
  const selector = `meta[${attribute}="${key}"]`
  const element = document.querySelector<HTMLMetaElement>(selector) ?? document.createElement("meta")
  element.setAttribute(attribute, key)
  element.content = content
  if (!element.parentNode) document.head.appendChild(element)
}
