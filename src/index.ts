import { FigmaDocument, parseDocument } from "./document"

// const SECTIONS = [
//   'functionals',
//   'tinted',
//   'component',
//   'outlier',
//   'color',
// ]

export function parseFile(filename: string) {
  const file: FigmaDocument = require(filename)
  return parseData(file)
}

export function parseData(doc: FigmaDocument) {
  return parseDocument(doc)
}

export function stripMetadata(theme: any): any {
  for (const key of Object.keys(theme)) {
    const val = theme[key]
    if (val.id) {
      theme[key] = val.color
    } else if (typeof val === 'object') {
      stripMetadata(val)
    }
  }

  return theme
}
