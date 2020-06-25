#!/usr/bin/env node

const path = require('path')

require('ts-node').register({
  "dir": path.resolve(__dirname, "..")
})
require('../src/cli.ts').default()
