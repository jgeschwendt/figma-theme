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
