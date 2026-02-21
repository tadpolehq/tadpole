#!/usr/bin/env node

import { program } from 'commander';
import { writeFile } from 'node:fs/promises';
import { execute } from '@tadpolehq/core';
import { createLogger, format, transports } from 'winston';

const log = createLogger({
  format: format.combine(format.colorize(), format.simple()),
  transports: [new transports.Console()],
});

program.name('tadpole');

program
  .command('run <file>')
  .option('--input <value>', 'JSON string of input values')
  .option('--output <value>', 'Path to write output to')
  .option(
    '--log-level <value>',
    "Sets the log level, must be one of 'debug', 'info', 'warn' and 'error'",
    'warn',
  )
  .action(async (filePath, options) => {
    log.level = options.logLevel;

    let input = {};
    if (options.input) {
      input = JSON.parse(options.input);
    }

    const result = await execute(filePath);
    if (result.isOk()) {
      const output = await result.value.execute({
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
  });

await program.parseAsync(process.argv);
