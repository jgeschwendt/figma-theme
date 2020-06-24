import { set } from 'lodash'
import { Color, extractColor } from './color'

export interface AggregateStyle {
  id: string
  key: string
  name: string
  description: string
  color: string | null
}

export interface StyleDeclarationMap {
  [key: string]: StyleDeclaration
}

export interface StyleDeclaration {
  key: string
  name: string
  styleType: string
  description: string
}

export interface StyleDefinition {
  blendMode: string
  type: string
  color: Color
  opacity?: number
}

export interface FigmaDocument {
  document: DocumentNode,
  styles: StyleDeclarationMap
}

export interface DocumentNode {
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

interface Metadata extends StyleDeclaration {
  id: string
  color: string | null
}

export interface Theme {
  [key: string]: Theme | Metadata | string | null
}

export function parseDocument(file: FigmaDocument): Theme {
  const styleIds = Object.keys(file.styles)

  const theme = {}
  const nodes = flattenDocument(file.document)

  for (const id of styleIds) {
    const styleDeclaration = file.styles[id]
    const nameParts = styleDeclaration.name.split("/").map(str => str.trim())

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


export function flattenDocument(node: DocumentNode): DocumentNode[] {
  const children = node.children || []
  return [node].concat(children.flatMap(flattenDocument))
}

export function fetchColor(nodes: DocumentNode[], styleId: string): string | null {
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
