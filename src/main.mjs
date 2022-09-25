import { tmpdir } from 'node:os'
import { readFileSync, writeFileSync } from 'node:fs'
import { join as pathJoin } from 'node:path'
import { createHash } from 'node:crypto'

import meow from 'meow'
import MFH from 'make-fetch-happen'
import ora from 'ora';


const pkgjson = JSON.parse(readFileSync('package.json', { encoding: 'utf8', flag: 'r' }))

const VS_VERSIONS_API = 'https://api.vintagestory.at/stable.json'

const cli = meow(`
  NAME
        ${pkgjson.name} - ${pkgjson.description}

  SYNOPSIS
        ${pkgjson.name} OUTPUT_DIRECTORY

  Options
    --help    Display this help
    --version Display the version number
    --output  Path to the output directory, required if you don't pass OUTPUT_DIRECTORY
    --api-url URL of the vintage story API

  Examples
    $ ${pkgjson.name} ./output
`, {
  importMeta: import.meta,
  allowUnknownFlags: false,
  flags: {
    help: {
      type: 'boolean',
      alias: 'h'
    },
    version: {
      type: 'boolean',
      alias: 'v'
    },
    output: {
      type: 'string',
      alias: 'o',
      isRequired: (flags, inputs) => !flags.output && inputs.length < 1
    },
    apiUrl: {
      type: 'string',
      alias: 'a',
      default: VS_VERSIONS_API
    },
  }
});

const fch = MFH.defaults({ cachePath: `${tmpdir}/${pkgjson.name}` })

const md5 = content => createHash('md5').update(content).digest('hex')
const ucfirst = str => str[0].toUpperCase() + str.slice(1)
const wait = async duration => new Promise((res => setTimeout(res, duration)))


const findLatestLinux = d => {
  let match = false
  for (const key in d) {
    if (Object.hasOwnProperty.call(d, key)) {
      match = key === 'latest' || (typeof d[key] === 'object' && findLatestLinux(d[key]))
      if (match) return { ...d[key].linux, version: key };
    }
  }
  return false
}


const tplParams = {
  version: null,
  vs_archive_md5: null,
  vs_desktop_md5: null,
  vs_sh_md5: null,
}
const convertToTemplateParams = ({ version, md5: vs_archive_md5 }) => { version, vs_archive_md5 }

export default async () => {
  const { input: cliInput, flags: { output: outputdir, apiUrl } } = cli
  const outputDir = outputdir || cliInput[0]
  const spinner = ora({
    text: 'Importing templates',
    spinner: {
      interval: 5,
      "frames": [
        ".  ",
        ".. ",
        "...",
        "   "
      ]
    }
  }).start();
  const templates = {
    PKGBUILD: await import('./templates/PKGBUILD.mjs'),
    SRCINFO: await import('./templates/SRCINFO.mjs'),
    vs_desktop: await import('./templates/vs_desktop.mjs'),
    vs_sh: await import('./templates/vs_sh.mjs'),
  }

  spinner.text = 'Templates imported.'
  await wait(250)
  spinner.text = 'calling the API.'

  let res
  try {
    res = await fch(VS_VERSIONS_API)
  } catch (e) {
    res = false
    spinner.text = 'API error'
    spinner.stop()
    console.error(e);
    return 1
  }

  spinner.text = 'API response received'
  await wait(250)
  spinner.text = 'Parsing API response'

  let vs_api_json
  try {
    vs_api_json = await res.json()
  } catch (e) {
    vs_api_json = {}
    return 1
  }

  spinner.text = 'Finding the latest release informations'

  const config = findLatestLinux(vs_api_json)
  if (!config) {
    spinner.text = 'Response parsing error'
    spinner.stop()
    console.error('Unable to find the latest release informations');
    return 1
  }

  spinner.text = 'API response parsed'
  await wait(250)
  spinner.text = 'Rendering templates and calculating md5'

  const vs_sh_rendered = templates.vs_sh.tpl(config)
  config.vs_sh_md5 = md5(vs_sh_rendered)

  const vs_desktop_rendered = templates.vs_desktop.tpl(config)
  config.vs_desktop_md5 = md5(vs_desktop_rendered)

  config.vs_archive_md5 = config.md5

  spinner.text = 'Templates rendered and md5 ready'
  await wait(250)
  spinner.text = `Writing files in the output directory "${outputDir}"`

  writeFileSync(pathJoin(outputDir, templates.vs_sh.filename), vs_sh_rendered)
  writeFileSync(pathJoin(outputDir, templates.vs_desktop.filename), vs_desktop_rendered)
  writeFileSync(pathJoin(outputDir, templates.PKGBUILD.filename), templates.PKGBUILD.tpl(config))
  writeFileSync(pathJoin(outputDir, templates.SRCINFO.filename), templates.SRCINFO.tpl(config))

  spinner.stop()
  console.log('DONE !');
}
