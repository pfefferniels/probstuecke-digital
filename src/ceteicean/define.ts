export default function define(elements: string[]) {
  if (typeof customElements === 'undefined') return
  for (const el of elements) {
    // Custom element names must be lowercase and contain a hyphen
    const name = el.toLowerCase()
    if (!name.includes('-')) continue
    try {
      if (!customElements.get(name)) {
        customElements.define(name, class extends HTMLElement {})
      }
    } catch {
      // Skip invalid custom element names
    }
  }
}
