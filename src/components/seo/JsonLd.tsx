import { useEffect } from 'react'

type JsonLdProps = {
  id: string
  data: Record<string, unknown> | Record<string, unknown>[]
}

/**
 * Injects JSON-LD into document head. Replaces any previous script with the same id.
 */
export default function JsonLd({ id, data }: JsonLdProps) {
  const serialized = JSON.stringify(data)

  useEffect(() => {
    const scriptId = `jsonld-${id}`
    let el = document.getElementById(scriptId) as HTMLScriptElement | null
    if (!el) {
      el = document.createElement('script')
      el.id = scriptId
      el.type = 'application/ld+json'
      document.head.appendChild(el)
    }
    el.text = serialized

    return () => {
      el?.remove()
    }
  }, [id, serialized])

  return null
}
