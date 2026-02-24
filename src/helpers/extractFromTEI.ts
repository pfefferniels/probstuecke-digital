import { JSDOM } from 'jsdom'
import serialize from "w3c-xmlserializer"

export const extractFromXML = (originalXml: string, selector: string) => {
    const jsdom = new JSDOM("")
    const dom = new jsdom.window.DOMParser().parseFromString(originalXml, "text/xml")

    const selected = dom.querySelector(selector)
    let clone: Node | undefined
    if (selected) {
      clone = selected.cloneNode(true)
      selected.remove()
    }

    return {
      original: serialize(dom),
      extracted: clone ? serialize(clone) : null
    }
}
