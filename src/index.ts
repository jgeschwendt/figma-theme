import chroma from 'chroma-js'
import { set } from 'lodash'

interface FigmaFile {
  document: DocumentNode,
  styles: StyleDeclarationMap
}

interface DocumentNode {
  children?: DocumentNode[]
  fills?: StyleDefinition[]
  strokes?: StyleDefinition[]
  styles?: {
    fill?: string
    fills?: string
    stroke?: string
    strokes?: string
  }
}

interface StyleDeclarationMap {
  [key: string]: StyleDeclaration
}

interface StyleDeclaration {
  key: string
  name: string
  styleType: string
  description: string
}

interface StyleDefinition {
  blendMode: string
  type: string
  color: Color
  opacity?: number
}

interface Color {
  r: number
  g: number
  b: number
  a: number
}

interface AggregateStyle {
  id: string
  key: string
  name: string
  description: string
  color: string | null
}

const SECTIONS = [
  'functionals',
  'tinted',
  'component',
  'outlier',
  'color',
]

function flattenDocument(node: DocumentNode): DocumentNode[] {
  const children = node.children || []
  return [node].concat(children.flatMap(flattenDocument))
}

function fetchColor(nodes: DocumentNode[], styleId: string): string | null {
  const node = nodes.find(n => {
    return n.styles &&
      [n.styles.fill, n.styles.fills, n.styles.stroke, n.styles.strokes].includes(styleId)
  })

  if (!node || !node.styles) {
    return null
  }

  let color: string
  if (node.styles.fill === styleId || node.styles.fills === styleId) {
    color = extractColor(node.fills!)
  } else if (node.styles.stroke === styleId || node.styles.strokes === styleId) {
    color = extractColor(node.strokes!)
  } else {
    throw new Error("Could not find color definition")
  }

  return color
}

function extractColor(defs: StyleDefinition[]): string {
  if (defs.length !== 1) {
    throw new Error("Style definition had more than once color")
  }
  const def = defs[0]

  // the color definition includes an alpha value, but in testing this was
  // always `1` and the actual alpha was represented in the `opacity` property
  // as a very imprecise float
  const {r, g, b} = def.color
  const a = def.opacity || 1
  const rgb = [r, g, b].map(i => i * 255)
  if (a === 1) {
    return chroma(rgb).hex()
  } else {
    const adjusted = Math.round(a * 100) / 100 // e.g. 0.699999988079071 -> 0.7
    const rgba = rgb.concat([adjusted])
    return chroma(rgba).css()
  }
}

function parseDocument(file: FigmaFile) {
  const styleIds = Object.keys(file.styles)

  const theme = {}
  const nodes = flattenDocument(file.document)

  for (const id of styleIds) {
    const styleDeclaration = file.styles[id]
    const nameParts = styleDeclaration.name.split("/").map(str => str.trim())
    if (!SECTIONS.includes(nameParts[0])) {
      continue
    }

    const color = fetchColor(nodes, id)

    const styleDec = file.styles[id]
    const def: AggregateStyle = {
      id,
      color,
      ...styleDec,
    }

    set(theme, nameParts.join('.'), def)
  }

  return theme
}

const file: FigmaFile = require('../ref.json')
const theme = parseDocument(file)
console.log(JSON.stringify(theme, null, '  '))
