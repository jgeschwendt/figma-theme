import * as fs from "fs"
import { Stream } from "stream"
import { FigmaDocument, parseDocument, Theme } from "./document"
import { streamToString } from "./util"

export function parseFile(filename: string) {
  const stream = fs.createReadStream(filename)
  return parseStream(stream)
}

export async function parseStream(stream: Stream): Promise<Theme> {
  const str = await streamToString(stream)
  const json = JSON.parse(str) as FigmaDocument
  return parseDocument(json)
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
