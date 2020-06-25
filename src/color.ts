import chroma from 'chroma-js'
import { StyleDefinition } from "./document"

export interface Color {
  r: number
  g: number
  b: number
  a: number
}

export function extractColor(defs: StyleDefinition[]): string {
  if (defs.length !== 1) {
    throw new Error("Style definition had more than one color")
  }
  const [def] = defs

  // the color definition includes an alpha value, but in testing this was
  // always `1` and the actual alpha was represented in the `opacity` property
  // as a very imprecise float
  const {r, g, b} = def.color
  const a = def.opacity || 1
  return colorToString({r, g, b, a})
}

export function colorToString(color: Color): string {
  const {r, g, b, a} = color
  const rgb = [r, g, b].map(i => i * 255)
  if (a === 1) {
    return chroma(rgb).hex()
  } else {
    const adjusted = Math.round(a * 100) / 100 // e.g. 0.699999988079071 -> 0.7
    return chroma(rgb.concat([adjusted])).css()
  }
}
