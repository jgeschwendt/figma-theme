import fs from "fs"
import path from "path"
import { exec } from "child_process"
import { assert } from "chai"
import tmp from 'tmp'
// import nock from "nock"

interface CliResult {
  stdout: string
  stderr: string
  code: number | null
}

const cmdPath = path.resolve(__dirname, '..', 'bin', 'cli-boot.js')
const fixtureFile = path.resolve(__dirname, 'fixtures', 'figma-file.json')

async function execute(args: string, env: NodeJS.ProcessEnv = {}): Promise<CliResult> {
  return new Promise((resolve, reject) => {
    const cp = exec(`${cmdPath} ${args}`, {
      cwd: path.join(__dirname, ".."),
      env: {...process.env, ...env},
    }, (_err, stdout, stderr) => {
      const result = { stdout, stderr, code: cp.exitCode }
      resolve(result)
    })
  })
}

describe("CLI", function() {
  this.slow(3000)
  this.timeout(20000)

  it("parses a local file", async () => {
    const result = await execute("./test/fixtures/figma-file.json")
    assert.equal(result.code, 0)
    assert.equal(result.stderr, "")
    assert.match(result.stdout, /^\{"functional":\{"fill":\{"red":"#ff0000"/)
  })

  it("pretty prints output", async () => {
    const result = await execute("--pretty ./test/fixtures/figma-file.json")
    assert.equal(result.code, 0)
    assert.equal(result.stderr, "")
    assert.match(result.stdout, /^\{\n  "functional": \{\n    "fill": \{\n      "red": "#ff0000"/)
  })

  it("includes metadata", async () => {
    const result = await execute("--metadata ./test/fixtures/figma-file.json")
    assert.equal(result.code, 0)
    assert.equal(result.stderr, "")
    assert.match(result.stdout, /^\{"functional":\{"fill":\{"red":\{"id":"1:5"/)
  })

  it("redirects to an output file", async () => {
    const file = tmp.fileSync()
    const result = await execute(`-o ${file.name} ./test/fixtures/figma-file.json`)
    assert.equal(result.code, 0)
    assert.equal(result.stderr, "")
    assert.equal(result.stdout, "")

    const contents = fs.readFileSync(file.name, { encoding: 'utf8' })
    assert.match(contents, /^\{"functional":\{"fill":\{"red":"#ff0000"/)
  })

  // This test hits the network, and cannot be easily mocked because
  // the CLI runs as a separate process and shares no memory with this process.
  // One option is to import the program object from `cli.ts` and set up
  // necessary exit hooks and spies to ensure that it does the right thing.

  // it("downloads data from the Figma API", async () => {
  //   const figmaFileId = "xRlnI4wD4TEQGzOERdUfJz"
  //   const scope = nock('https://api.figma.com', {
  //     reqheaders: {
  //       'X-Figma-Token': 'figma_token'
  //     }
  //   })
  //     .get(`/v1/files/${figmaFileId}`)
  //     .reply(200, () => {
  //       return fs.createReadStream(fixtureFile)
  //     })

  //   const result = await execute(`--id ${figmaFileId}`, { FIGMA_TOKEN: "figma_token" })
  //   scope.done()
  //   assert.equal(result.code, 0)
  //   assert.equal(result.stderr, "")
  //   assert.match(result.stdout, /^\{"functional":\{"fill":\{"red":"#ff0000"/)
  // })

  it("errors when no file is specified", async () => {
    const result = await execute("")
    assert.equal(result.code, 1)
    assert.equal(result.stdout, "")
    assert.match(result.stderr, /must specify a file/)
  })

  it("errors when the file doesn't exist", async () => {
    const result = await execute("./fake-figma-file.json")
    assert.equal(result.code, 1)
    assert.equal(result.stdout, "")
    assert.match(result.stderr, /not exist/)
  })

  it("errors when the file is not well formed", async () => {
    const result = await execute("./README.md")
    assert.equal(result.code, 1)
    assert.equal(result.stdout, "")
    assert.match(result.stderr, /not an exported Figma file/)
  })

  it("errors when fetching from network and FIGMA_TOKEN is not set", async () => {
    const result = await execute("--id asdf", { FIGMA_TOKEN: "" })
    assert.equal(result.code, 1)
    assert.equal(result.stdout, "")
    assert.match(result.stderr, /FIGMA_TOKEN environment variable/)
  })

  it("errors when specifying both a Figma file ID and a local file", async () => {
    const result = await execute("--id asdf ./some_file", { FIGMA_TOKEN: "token" })
    assert.equal(result.code, 1)
    assert.equal(result.stdout, "")
    assert.match(result.stderr, /may not specify an input file/)
  })
})

