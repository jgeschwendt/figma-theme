import path from "path"
import { parseFile } from "../src"
import { assert, expect } from "chai"
import { get } from "lodash"

describe("parseFile", () => {
  let theme: any = null
  const allColors = [
    'functional.fill.blue',
    'functional.fill.blue-alpha',
    'functional.fill.red',
    'functional.fill.gray',
    'borders.black-fade-30',
    'borders.green',
    'borders.orange',
  ]
  const hexColors = [
    'functional.fill.blue',
    'functional.fill.red',
    'borders.green',
    'borders.orange',
  ]
  const rgbaColors = [
    'functional.fill.blue-alpha',
    'borders.black-fade-30',
  ]

  beforeEach(() => {
    theme = parseFile(path.join(__dirname, "fixtures", "figma-file.json"))
  })

  it("creates a theme entry for every expected style", () => {
    allColors.forEach(path => {
      const val = get(theme, path)
      assert.isDefined(val)
    })
  })

  it("sets color to null for styles not used in the document", () => {
    assert.isNull(theme.functional.fill.gray.color)
  })

  it("creates hex values for colors with no alpha", () => {
    const hexRegex = /#[0-9a-f]{6}/i

    hexColors.forEach(path => {
      const val = get(theme, path)
      assert.match(val.color, hexRegex)
    })
  })

  it("creates rgba values for colors with alpha", () => {
    const rgbaRegex = /rgba\(\d+,\d+,\d+,\d+\.\d+\)/i

    rgbaColors.forEach(path => {
      const val = get(theme, path)
      assert.match(val.color, rgbaRegex)
    })
  })

  it("maintains style metadata", () => {
    const val = get(theme, "functional.fill.blue")
    assert.deepEqual(val, {
      id: '1:7',
      color: '#0085ff',
      key: 'f8cb2ed792374ea2986769525a417b26fdcd072f',
      name: 'functional / fill / blue',
      styleType: 'FILL',
      description: ''
    })
  })
})
