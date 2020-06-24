import { FigmaDocument, parseDocument, Theme } from "./document"

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

export function stripMetadata(theme: Theme): Theme {
  for (const key of Object.keys(theme)) {
    const val = theme[key]
    if (val === null || typeof val === "string") {
      // do nothing
    } else if (val.id) {
      theme[key] = val.color
    } else {
      stripMetadata(val as Theme)
    }
  }

  return theme
}
