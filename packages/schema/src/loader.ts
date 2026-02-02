import { parse } from 'kdljs';
import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { URL } from 'node:url';
import { Err, Ok, type Result } from 'ts-results-es';
import { fileExistsAsync, spawnAsync } from '@tadpolehq/utils';
import type { Document } from './types/index.js';

export function getCacheDir(name: string): string {
  const home = os.homedir();
  switch (process.platform) {
    case 'win32':
      return path.join(
        process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local'),
        name,
        'Cache',
      );
    case 'darwin':
      return path.join(home, 'Library', 'Caches', name);
    default:
      return path.join(
        process.env.XDG_CACHE_HOME || path.join(home, '.cache'),
        name,
      );
  }
}

export interface LoadResult {
  cached: boolean;
  resolvedPath: string;
  document: Document;
}

export interface ILoader {
  loadFromFilePath(
    currentFile: string,
    filePath: string,
  ): Promise<Result<LoadResult, Error>>;
  loadFromGitRepo(
    filePath: string,
    repo: string,
    ref?: string,
  ): Promise<Result<LoadResult, Error>>;
}

export class Loader implements ILoader {
  private _cache: Map<string, Document>;

  constructor(private cacheDirName_: string) {
    this._cache = new Map();
  }

  async loadFromFilePath(
    currentFile: string,
    filePath: string,
  ): Promise<Result<LoadResult, Error>> {
    const resolvedPath = path.resolve(path.dirname(currentFile), filePath);
    if (this._cache.has(resolvedPath))
      return new Ok({
        cached: true,
        resolvedPath,
        document: this._cache.get(resolvedPath)!,
      });

    return await this.loadAndParseFile(resolvedPath);
  }

  async loadFromGitRepo(
    filePath: string,
    repo: string,
    ref: string = 'main',
  ): Promise<Result<LoadResult, Error>> {
    const cleanedRepoUrl = repo.startsWith('http') ? repo : `https://${repo}`;
    const url = new URL(cleanedRepoUrl);
    const cacheDir = getCacheDir(this.cacheDirName_);
    const repoPath = url.pathname.replace(/\.git$/, '').replace(/^\/|\/$/g, '');
    const cloneDir = path.join(cacheDir, 'repos', url.hostname, repoPath, ref);
    const resolvedPath = path.join(cloneDir, filePath);
    if (this._cache.has(resolvedPath))
      return new Ok({
        cached: true,
        resolvedPath,
        document: this._cache.get(resolvedPath)!,
      });

    if (!(await fileExistsAsync(cloneDir))) {
      const args = [
        'clone',
        '--depth',
        '1',
        '--branch',
        ref,
        cleanedRepoUrl,
        cloneDir,
      ];
      try {
        await spawnAsync('git', args);
      } catch (err) {
        return new Err(err as Error);
      }
    }

    return await this.loadAndParseFile(resolvedPath);
  }

  private async loadAndParseFile(
    resolvedPath: string,
  ): Promise<Result<LoadResult, Error>> {
    let data;
    try {
      data = await readFile(resolvedPath, 'utf-8');
    } catch (err) {
      return new Err(err as Error);
    }

    const result = parse(data);
    if (result.errors.length) {
      return new Err(new Error(`Error parsing document: ${result.errors}`));
    }

    this._cache.set(resolvedPath, result.output!);

    return new Ok({
      cached: false,
      resolvedPath,
      document: result.output!,
    });
  }
}
