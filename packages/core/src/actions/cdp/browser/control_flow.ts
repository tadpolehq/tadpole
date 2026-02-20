import * as root from '@/actions/root/index.js';
import { Registry } from './base.js';

export const ParallelParser = root.control_flow.ParallelParser(Registry);
