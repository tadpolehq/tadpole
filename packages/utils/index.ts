import {
  spawn,
  type ChildProcessWithoutNullStreams,
  type SpawnOptionsWithoutStdio,
} from 'node:child_process';
import fs from 'node:fs/promises';

export async function fileExistsAsync(path: string): Promise<boolean> {
  try {
    await fs.access(path, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export function spawnAsync(
  command: string,
  args: readonly string[],
  options?: SpawnOptionsWithoutStdio,
  resolveOn:
    | 'close'
    | 'spawn'
    | ((child: ChildProcessWithoutNullStreams) => Promise<void>) = 'close',
): Promise<ChildProcessWithoutNullStreams> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);

    child.on('error', (err) => {
      reject(new Error(`Failed to start process: ${err.message}`));
    });

    if (resolveOn === 'close') {
      let errorData = '';

      child.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(child);
        } else {
          reject(
            new Error(`Command failed with code ${code}. Error: ${errorData}`),
          );
        }
      });
    } else if (resolveOn === 'spawn') {
      child.on('spawn', () => {
        resolve(child);
      });
    } else {
      resolveOn(child)
        .then(() => resolve(child))
        .catch((err) => {
          reject(err);
        });
    }
  });
}
