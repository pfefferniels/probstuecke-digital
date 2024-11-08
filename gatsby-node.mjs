import createVerovioModule from 'verovio/wasm';
import { VerovioToolkit } from 'verovio/esm';
import { JSDOM } from 'jsdom'
import * as path from 'path'
import { transformToCeteicean } from './src/helpers/transformToCeteicean.mjs'
import { extractFromXML } from './src/helpers/extractFromTEI.mjs';
import { collectExpressionMetadata, collectEmbeddedMEI, collectRefTargets } from './src/helpers/collectors/index.mjs';

const modernizeTEI = async (rawXml) => {
  const modernized = await fetch("https://www.deutschestextarchiv.de/public/cab/query?a=default&fmt=xml&clean=1&pretty=1&raw=1&qname=qd&file=C%3A%5Cfakepath%5Ccomments_de.xml", {
    "referrer": "https://www.deutschestextarchiv.de/public/cab/file",
    "body": rawXml,
    "method": "POST",
    "mode": "cors"
  });

  return modernized.text()
}

const vrvModule = await createVerovioModule()
const verovioToolkit = new VerovioToolkit(vrvModule)

export const shouldOnCreateNode = ({ node }) => {
  // We only care about TEI content
  return [`application/xml`, `text/xml`].includes(node.internal.mediaType)
}

const onCreateWorks = async ({
  node,
  actions,
  loadNodeContent,
  createNodeId,
  createContentDigest
}) => {
  const { createNode, createParentChildLink } = actions

  const rawXml = await loadNodeContent(node)
  const { document } = (new JSDOM(rawXml)).window

  verovioToolkit.setOptions({
    svgViewBox: true,
    footer: 'none',
    adjustPageHeight: true
  })

  Array
    .from(document.querySelectorAll('work'))
    .map((work, i) => {
      const key = work.querySelector('key')
      const incipitCode = work.querySelector('incip')
      let incipitSvg = ''
      if (incipitCode) {
        verovioToolkit.loadData(incipitCode.textContent.trim())
        incipitSvg = verovioToolkit.renderToSVG(1)
      }

      return {
        xmlId: work.getAttribute('xml:id'),
        title: work.querySelector('title').textContent || '[no title]',
        incipitSvg,
        key: key
          ? Array
            .from(key.attributes)
            .reduce((obj, attr) => {
              obj[attr.name] = attr.value;
              return obj;
            }, {})
          : {},
        id: createNodeId(`${node.id}_${i} >>> XML`),
        parent: node.id,
        internal: {
          contentDigest: createContentDigest({ rawXml }),
          type: `work`
        }
      }
    })
    .forEach(async work => {
      await createNode(work)
      createParentChildLink({ parent: node, child: work })
    })
}

export const onCreateNode = async ({
  node,
  actions,
  loadNodeContent,
  createNodeId,
  createContentDigest,
}) => {
  const { createNode, createParentChildLink } = actions

  const rawXml = await loadNodeContent(node)
  const { document } = (new JSDOM(rawXml)).window

  const meiRoot = document.querySelector('mei')
  if (meiRoot && meiRoot.getAttribute('xml:id') === 'works') {
    onCreateWorks({ node, actions, loadNodeContent, createNodeId, createContentDigest })
    return
  }

  const teiRoot = document.querySelector('TEI')
  if (!teiRoot) return

  const refTargets = collectRefTargets(document)
  const mei = collectEmbeddedMEI(document, node.absolutePath)
  const metadata = collectExpressionMetadata(document)

  const modernized = metadata.derivationType === 'edition'
    ? await modernizeTEI(rawXml)
    : rawXml

  const selectors = {
    'title': 'div[type="score"] head',
    'score': 'div[type="score"]',
    'facsimile': 'facsimile',
    'metadata': 'fileDesc',
    'text': 'text'
  }

  const sections = Object
    .entries(selectors)
    .reduce((prev, [fill, selector]) => {
      const extract = extractFromXML(
        prev.length === 0 ? modernized : prev[prev.length - 1].reduced,
        selector)

      prev.push({
        fill,
        with: extract.extracted,
        reduced: extract.original
      })

      return prev;
    }, [])
    .map(extract => {
      return {
        fill: extract.fill,
        with: transformToCeteicean(extract.with)
      }
    })
    .reduce((prev, curr) => {
      prev[curr.fill] = curr.with
      return prev
    }, {})

  const obj = {
    ...sections,
    ...metadata,
    mei,
    refTargets,
    id: createNodeId(`${node.id} >>> XML`),
    children: [],
    parent: node.id,
    internal: {
      contentDigest: createContentDigest({ rawXml }),
      type: `expression`
    }
  }

  await createNode(obj)
  createParentChildLink({ parent: node, child: obj })
}

export const createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions

  const result = await graphql(
    `
        {
          allExpression {
            edges {
              node {
                score {
                  original
                  prefixed
                  elements
                }
                title {
                  original
                  prefixed
                  elements
                }
                facsimile {
                  original
                }
                text {
                  original
                  prefixed
                  elements
                }
                expressionId
                realises
                mei {
                  xmlId
                  mei
                }
                refTargets
              }
            }
          }
        }
      `
  )

  // Handle errors
  if (result.errors) {
    reporter.panicOnBuild(`Error while running GraphQL query.`)
    return
  }

  const pieceTemplate = path.resolve(`src/templates/Piece.tsx`)
  result.data.allExpression.edges.forEach(({ node }) => {
    if (!node.expressionId) return
    createPage({
      path: node.expressionId,
      component: pieceTemplate,
      context: {
        piece: node,
      },
    })
  })
}
