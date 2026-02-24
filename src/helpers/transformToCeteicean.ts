import { JSDOM } from "jsdom"
import serialize from "w3c-xmlserializer"

function getAttributeNames(el: Element): string[] {
  const attrs = el.attributes
  const names: string[] = []
  for (let i = attrs.length - 1; i >= 0; i--) {
    names.push(attrs[i].name)
  }
  return names
}

const namespaces: Record<string, string> = {
  "http://www.tei-c.org/ns/1.0": "tei",
  "http://www.tei-c.org/ns/Examples": "teieg"
}

export const transformToCeteicean = (rawXml: string) => {
  const jsdom = new JSDOM("")
  const dom = new jsdom.window.DOMParser().parseFromString(rawXml, "text/xml")

  const elements = new Set<string>()

  const convertEl = (el: Element): Element => {
    let newElement: Element
    const ns = el.namespaceURI ? el.namespaceURI : ""
    if (Object.prototype.hasOwnProperty.call(namespaces, ns)) {
      const prefix = namespaces[ns]
      newElement = dom.createElement(`${prefix}-${el.localName}`)
      elements.add(`${prefix}-${el.localName}`)
    } else {
      newElement = dom.importNode(el, false) as Element
      elements.add(`custom-${el.localName}`)
    }
    for (const att of Array.from(el.attributes)) {
      if (att.name == "xmlns") {
        newElement.setAttribute("data-xmlns", att.value)
      } else {
        newElement.setAttribute(att.name, att.value)
      }
      if (att.name == "xml:id") {
        newElement.setAttribute("id", att.value)
      }
      if (att.name == "xml:lang") {
        newElement.setAttribute("lang", att.value)
      }
      if (att.name == "rendition") {
        newElement.setAttribute("class", att.value.replace(/#/g, ""))
      }
    }
    newElement.setAttribute("data-origname", el.localName)
    if (el.hasAttributes()) {
      newElement.setAttribute("data-origatts", getAttributeNames(el).join(" "))
    }
    if (el.childNodes.length == 0) {
      newElement.setAttribute("data-empty", "")
    }
    if (el.localName == "tagsDecl") {
      const style = dom.createElement("style")
      for (const node of Array.from(el.children)) {
        if (
          node.localName == "rendition" &&
          node.getAttribute("scheme") == "css"
        ) {
          let rule = ""
          if (node.hasAttribute("selector")) {
            rule +=
              node
                .getAttribute("selector")!
                .replace(/([^#, >]+\w*)/g, "tei-$1")
                .replace(/#tei-/g, "#") + "{\n"
            rule += node.textContent
          } else {
            rule += "." + node.getAttribute("xml:id") + "{\n"
            rule += node.textContent
          }
          rule += "\n}\n"
          style.appendChild(dom.createTextNode(rule))
        }
      }
      if (style.childNodes.length > 0) {
        newElement.appendChild(style)
      }
    }
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType == 1) {
        newElement.appendChild(convertEl(node as Element))
      } else {
        newElement.appendChild(node.cloneNode())
      }
    }
    return newElement
  }

  const data = convertEl(dom.documentElement)
  const prefixed = serialize(data)

  return {
    original: rawXml,
    prefixed,
    elements: Array.from(elements)
  }
}
