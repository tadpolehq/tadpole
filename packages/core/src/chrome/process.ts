import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileExistsAsync, spawnAsync } from '@tadpolehq/utils';

export interface ProcessOptions {
  pathToExec: string;
  remoteDebuggingPort: number;
  userDataDir: string;
  flags?: string[];
  env?: Record<string, string>;
}

export interface LaunchOptions {
  startTimeout?: number;
}

export class Process {
  private process_: ChildProcessWithoutNullStreams | null;
  private pathToExec_: string;
  private remoteDebuggingPort_: number;
  private userDataDir_: string;
  private flags_: string[];
  private env_: Record<string, string>;

  constructor({
    pathToExec,
    remoteDebuggingPort,
    userDataDir,
    flags,
    env,
  }: ProcessOptions) {
    this.process_ = null;
    this.pathToExec_ = pathToExec;
    this.remoteDebuggingPort_ = remoteDebuggingPort;
    this.userDataDir_ = userDataDir;
    this.flags_ = flags ?? [];
    this.env_ = env ?? {};
  }

  static async findPath(): Promise<string | undefined> {
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

    return;
  }

  get launchArgs(): string[] {
    return [
      `--remote-debugging-port=${this.remoteDebuggingPort_}`,
      `--user-data-dir=${this.userDataDir_}`,
      ...this.flags_,
    ];
  }

  async launch({ startTimeout = 10000 }: LaunchOptions = {}) {
    if (this.process_ !== null) throw new Error('Chrome is already running.');

    this.process_ = await spawnAsync(
      this.pathToExec_,
      this.launchArgs,
      {
        env: {
          ...process.env,
          ...this.env_,
        },
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
  }

  async stop() {
    if (this.process_ === null)
      throw new Error('Chrome is not currently running');

    this.process_.kill();
    this.process_ = null;
  }
}
