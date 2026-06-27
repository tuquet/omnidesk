import customBlocks from '@business/dev/blocks';
import { tasks } from './shared';

export function getBlocks() {
  return { ...tasks, ...customBlocks() };
}
