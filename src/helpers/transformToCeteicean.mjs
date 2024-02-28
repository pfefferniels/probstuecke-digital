import { JSDOM } from "jsdom"
import serialize from "w3c-xmlserializer";

function getAttributeNames(el) {
  const attrs = el.attributes
  const names = []
  for (let i = attrs.length - 1; i >= 0; i--) {
    names.push(attrs[i].name)
  }
  return names
}

export const transformToCeteicean = rawXml => {
  const namespaces = {
    "http://www.tei-c.org/ns/1.0": "tei",
    "http://www.tei-c.org/ns/Examples": "teieg"
  }

  const jsdom = new JSDOM("");
  const dom = new jsdom.window.DOMParser().parseFromString(rawXml, "text/xml");

  const elements = new Set()

  const convertEl = el => {
    let newElement
    const ns = el.namespaceURI ? el.namespaceURI : ""
    if (namespaces.hasOwnProperty(ns)) {
      const prefix = namespaces[ns]
      newElement = dom.createElement(`${prefix}-${el.localName}`)
      elements.add(`${prefix}-${el.localName}`)
    } else {
      newElement = dom.importNode(el, false)
      elements.add(`custom-${el.localName}`)
    }
    // Copy attributes @xmlns, @xml:id, @xml:lang, and
    // @rendition get special handling.
    for (const att of Array.from(el.attributes)) {
      if (att.name == "xmlns") {
        //Strip default namespaces, but hang on to the values
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
    // Preserve element name so we can use it later
    newElement.setAttribute("data-origname", el.localName)
    if (el.hasAttributes()) {
      newElement.setAttribute("data-origatts", getAttributeNames(el).join(" "))
    }
    // If element is empty, flag it
    if (el.childNodes.length == 0) {
      newElement.setAttribute("data-empty", "")
    }
    // Turn <rendition scheme="css"> elements into HTML styles
    if (el.localName == "tagsDecl") {
      let style = dom.createElement("style")
      for (let node of Array.from(el.children)) {
        if (
          node.localName == "rendition" &&
          node.getAttribute("scheme") == "css"
        ) {
          let rule = ""
          if (node.hasAttribute("selector")) {
            //rewrite element names in selectors
            rule +=
              node
                .getAttribute("selector")
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
    for (let node of Array.from(el.childNodes)) {
      if (node.nodeType == 1) {
        newElement.appendChild(convertEl(node))
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
