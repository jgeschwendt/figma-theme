# @primer/figma-theme

Generate a JSON representation of style colors from a Figma file. Forked from [jxnblk/figma-theme][fork], which was created by [Brent Jackson][brent].

## Installation

To use the command-line API, you may want to install the package globally:

```sh
# with npm
npm i -g @primer/figma-theme

# with yarn
yarn global add @primer/figma-theme
```

If you plan on using the package as part of another Node.js project, you can install it to your dependencies:

```sh
# with npm
npm i @primer/figma-theme

# with yarn
yarn add @primer/figma-theme
```

If you've installed the package as a local dependency, you can run the binary with:

```sh
./node_modules/.bin/figma-theme
```

## Basic Usage

The CLI can parse JSON created from the [Figma API][api] and outputs JSON data to standard output.

### Local files

To parse a JSON file created from the Figma API, pass the filename of the JSON file to the command:

```sh
figma-theme my-figma-export.json
```

You can also use `-` to specify stdin as the source for the JSON data:

```sh
./my-export-script.sh | figma-theme -
```

### Download from the Figma API

If you specify your Figma [personal access token][token] via an environment variable or a `.env` file, the CLI can contact the Figma API and export the file for you:

```sh
# using an environment variable
FIGMA_TOKEN=asdf1234 figma-theme ...

# using a .env file
echo "FIGMA_TOKEN=asdf1234" > .env
figma-theme ...
```

To specify which file to export, use the `--fetch` option to specify a Figma file ID:

```sh
FIGMA_TOKEN=asdf1234 figma-theme --fetch xRlnI4wD4TEQGzOERdUfJz
```

To identify the Figma file ID, look at the part of the URL after `/file/`. For example, in the URL:

```
https://www.figma.com/file/abcdef123456/My-Figma-File
```

the ID is `abcdef123456`.

## Figma styles

The styles in your Figma file must adhere to the following rules:

- Create a nested structure by using `/` in your style names, e.g. `functional / text / primary` (spaces are optional)
- Your style names must not contain a period
- Every style you want to be a part of your theme must be used in the file; if a style is unused, its color will be `null`

## Options

Options are passed as CLI flags.

- `--out <file>`: redirect output to the given file
- `--pretty`: format the JSON output to be more human readable
- `--metadata`: include additional metadata for each style
- `--fetch <file_id>`: fetch the specified Figma document from the Figma API

For a full list of options, run `figma-theme --help`.

## Example

```sh
$ figma-theme --pretty test/fixtures/figma-file.json

{
  "functional": {
    "fill": {
      "red": "#ff0000",
      "blue": "#0085ff",
      "blue-alpha": "rgba(0,133,255,0.7)",
      "gray": null,
    }
  },
  "borders": {
    "green": "#007521",
    "orange": "#ff7a00",
    "black-fade-30": "rgba(0,0,0,0.3)",
  }
}
```

## Local development

To develop locally, clone the repository and install the dependencies with [Yarn][yarn].

```sh
# install dependencies
yarn install

# run tests
yarn test

# test the CLI
./bin/cli-boot.js --options file
```

[fork]: https://github.com/jxnblk/figma-theme
[brent]: https://github.com/jxnblk
[api]: https://www.figma.com/developers/api#files-endpoints
[token]: https://www.figma.com/developers/docs#auth-dev-token
[yarn]: https://yarnpkg.com/
