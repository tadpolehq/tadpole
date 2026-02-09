#!/usr/bin/env node

import { program } from 'commander';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execute } from '@tadpolehq/core';
import { fileExistsAsync, spawnAsync } from '@tadpolehq/utils';
import { createLogger, format, transports } from 'winston';

async function findChrome(): Promise<string | null> {
  let paths: string[] = [];
  switch (os.platform()) {
    case 'win32': {
      const suffixes = [
        '\\Google\\Chrome\\Application\\chrome.exe',
        '\\Chromium\\Application\\chrome.exe',
        '\\Microsoft\\Edge\\Application\\msedge.exe',
      ];
      const prefixes = [
        process.env.PROGRAMFILES,
        process.env['PROGRAMFILES(X86)'],
        process.env.LOCALAPPDATA,
      ];
      for (const prefix of prefixes) {
        if (prefix) {
          for (const suffix of suffixes) {
            paths.push(path.join(prefix, suffix));
          }
        }
      }
      break;
    }
    case 'darwin':
      paths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
      ];
      break;
    case 'linux':
      paths = [
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
      ];
      break;
  }

  for (const path of paths) {
    if (await fileExistsAsync(path)) return path;
  }

  return null;
}

async function launchChrome(
  port: number,
  headless: boolean,
  userDataDir: string,
  fallBackChromePath: string | null,
  windowHeight: number,
  windowWidth: number,
) {
  const chromePath = (await findChrome()) ?? fallBackChromePath;
  if (chromePath === null)
    throw new Error(
      'Chrome not found. Install Chrome or run manually if path is not standard.',
    );

  if (!fileExistsAsync(userDataDir)) {
    await mkdir(userDataDir, { recursive: true });
  }

  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    `--window-size=${windowWidth},${windowHeight}`,
    '--disable-blink-features=AutomationControlled',
  ];
  if (headless) args.push('--headless=new');

  const child = await spawnAsync(
    chromePath,
    args,
    {
      detached: true,
    },
    (child) => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('Chrome timeout')),
          15000,
        );

        child.stderr.on('data', (chunk) => {
          if (chunk.toString().includes('DevTools listening on')) {
            clearTimeout(timeout);
            resolve();
          }
        });
      });
    },
  );
  child.unref();
  return child;
}

const log = createLogger({
  format: format.combine(format.colorize(), format.simple()),
  transports: [new transports.Console()],
});

program.name('tadpole');

program
  .command('run <file>')
  .option('--input <value>', 'JSON string of input values')
  .option('--output <value>', 'Path to write output to')
  .option('--host', 'Chrome remote debugging host', 'localhost')
  .option('--port <value>', 'Chrome remote debugging port', parseInt, 9222)
  .option('--auto', 'Whether or not to try to launch Chrome automatically')
  .option(
    '--headless',
    'If --auto is used, whether or not to start Chrome in headless mode',
  )
  .option(
    '--user-data-dir',
    'If --auto is used, the custom user-data-dir to use when starting Chrome.',
    path.join(process.cwd(), '.tadpole', 'profile'),
  )
  .option(
    '--log-level <value>',
    "Sets the log level, must be one of 'debug', 'info', 'warn' and 'error'",
    'warn',
  )
  .option(
    '--chrome-bin <value>',
    'The full path to the Chrome executable, used as a fallback when used with --auto',
  )
  .option(
    '--window-height <value>',
    'If --auto is used, the height of the browser window',
    parseInt,
    1080,
  )
  .option(
    '--window-width <value>',
    'If --auto is used, the width of the browser window',
    parseInt,
    1920,
  )
  .action(async (filePath, options) => {
    log.level = options.logLevel;

    let chrome;
    if (options.auto) {
      chrome = await launchChrome(
        options.port,
        options.headless,
        options.userDataDir,
        options.chromeBin ?? null,
        options.windowHeight,
        options.windowWidth,
      );
    }

    let input = {};
    if (options.input) {
      input = JSON.parse(options.input);
    }

    const result = await execute(filePath);
    if (result.isOk()) {
      const output = await result.value.execute({
        host: options.host,
        port: options.port,
        log,
        expressionValues: input,
      });
      const serialized = JSON.stringify(
        output,
        (_, value) => {
          if (value instanceof Map) {
            return Object.fromEntries(value);
          }
          return value;
        },
        2,
      );
      if (options.output) {
        await writeFile(options.output, serialized);
      } else {
        console.log(serialized);
      }
    } else {
      log.error(
        `Error parsing definition: ${JSON.stringify(
          result.error.flatten(),
          undefined,
          2,
        )}`,
      );
    }

    if (chrome) chrome.kill();
  });

await program.parseAsync(process.argv);
