import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileExistsAsync, spawnAsync } from '@tadpolehq/utils';

export interface ProcessOptions {
  pathToExec: string;
  remoteDebuggingPort: number;
  userDataDir: string;
  extraArgs?: string[];
}

export interface LaunchOptions {
  startTimeout: number;
}

export class Process {
  private process_: ChildProcessWithoutNullStreams | null;
  private pathToExec_: string;
  private remoteDebuggingPort_: number;
  private userDataDir_: string;
  private extraArgs_: string[];

  constructor({
    pathToExec,
    remoteDebuggingPort = 9222,
    userDataDir = path.join(process.cwd(), '.tadpole', 'profile'),
    extraArgs,
  }: ProcessOptions) {
    this.process_ = null;
    this.pathToExec_ = pathToExec;
    this.remoteDebuggingPort_ = remoteDebuggingPort;
    this.userDataDir_ = userDataDir;
    this.extraArgs_ = extraArgs ?? [];
  }

  static async findPath(): Promise<string | null> {
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

  get launchArgs(): string[] {
    return [
      `--remote-debugging-port=${this.remoteDebuggingPort_}`,
      `--user-data-dir=${this.userDataDir_}`,
      ...this.extraArgs_,
    ];
  }

  async launch({ startTimeout = 10000 }: LaunchOptions) {
    if (this.process_ !== null) throw new Error('Chrome is already running.');

    this.process_ = await spawnAsync(
      this.pathToExec_,
      this.launchArgs,
      {
        detached: true,
      },
      (child) => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error('Chrome timeout')),
            startTimeout,
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
    this.process_.unref();

    process.on('exit', () => {
      this.process_?.kill();
    });
  }

  async stop() {
    if (this.process_ === null)
      throw new Error('Chrome is not currently running');

    this.process_.kill();
    this.process_ = null;
  }
}
