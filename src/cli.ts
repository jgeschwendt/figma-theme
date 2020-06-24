import * as fs from 'fs'
import { Stream } from 'stream'
import { Command } from 'commander'
import request from 'request'
import dedent from 'dedent'
import { Options } from './options'
import { parseData, stripMetadata } from './index'
const pkg = require('../package.json')

const program = new Command('figma-theme')
program
  .storeOptionsAsProperties(false)
  .usage('[options] [<file>]')
  .option('-o, --out <file>', 'redirect output to the given file')
  .option('--id <id>', 'download the Figma file with the given ID instead of using an input file')
  .option('--pretty', 'pretty-print JSON output')
  .option('--metadata', 'resolve additional metadata for each style')
  .version(pkg.version, '-v, --version', 'output the current version')

program.on('--help', () => {
  console.log('')
  console.log(dedent`
    Examples:

      Parsing a local JSON file exported from the Figma API:
        $ figma-theme figma-export.json

      Parsing JSON from standard input:
        $ ./my-export-script.sh | figma-theme -

      Parsing a Figma file by ID (requires Figma access token):
        $ FIGMA_TOKEN=token figma-theme --id figma_file_id

    For more information, visit:
      https://github.com/primer/figma-theme#readme
  `)
})

export { program }

export default function execute(argv = process.argv) {
  program.parse(process.argv)

  const opts = program.opts() as Options
  const args = program.args
  const help = program.helpInformation()

  if (opts.id) {
    if (args.length) {
      console.error(dedent`
        Error: you may not specify an input file when using --id to specify a Figma file.

        ${help}
      `)
      process.exit(1)
    }

    if (!process.env.FIGMA_TOKEN) {
      console.error(dedent`
        Error: the FIGMA_TOKEN environment variable must be set to download files from the
        Figma API. Specify a token or use a .env file in the current directory with
        FIGMA_TOKEN set.

        For more information, visit:
          https://github.com/primer/figma-theme#readme
      `)
      process.exit(1)
    }

    downloadAndParse(opts.id, process.env.FIGMA_TOKEN, opts)
  } else if (args.length === 1) {
    const input = args[0]

    if (input === '-') {
      consumeAndParseStream(process.stdin, opts)
    } else {
      parseFile(input, opts)
    }
  } else {
    console.error(dedent`
      Error: you must specify a file to parse or a Figma file to download.

      ${help}
    `)
    process.exit(1)
  }
}

function downloadAndParse(figmaFileId: string, figmaToken: string, opts: Options) {
  const figmaFileUrl = `https://api.figma.com/v1/files/${figmaFileId}`
  const stream = request({
    url: figmaFileUrl,
    headers: {
      'X-Figma-Token': figmaToken
    }
  })
  .on('response', (resp) => {
    if (resp.statusCode !== 200) {
      console.error(`Non-200 status code from Figma API: ${resp.statusCode}`)
      process.exit(1)
    }
  })

  consumeAndParseStream(stream, opts)
}

function parseFile(filename: string, opts: Options) {
  if (fs.existsSync(filename)) {
    const stream = fs.createReadStream(filename)
    consumeAndParseStream(stream, opts)
  } else {
    console.error(`The specified file does not exist: ${filename}`)
    process.exit(1)
  }
}

async function consumeAndParseStream(stream: Stream, opts: Options) {
  const str = await streamToString(stream)
  parseString(str, opts)
}

function parseString(data: string, opts: Options) {
  try {
    const json = JSON.parse(data)
    let theme = parseData(json)

    if (!opts.metadata) {
      theme = stripMetadata(theme)
    }

    let output = ""
    if (opts.pretty) {
      output = JSON.stringify(theme, null, '  ')
    } else {
      output = JSON.stringify(theme)
    }

    if (opts.out) {
      fs.writeFileSync(opts.out, output, { encoding: 'utf8' })
    } else {
      console.log(output)
    }
  } catch (err) {
    if (err.name === 'SyntaxError') {
      console.error(`The data is not an exported Figma file or is corrupt`)
    } else {
      console.error('A fatal error occurred:')
      console.error(err)
    }

    process.exit(1)
  }
}

function streamToString (stream: Stream): Promise<string> {
  const chunks: Buffer[] = []
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}

