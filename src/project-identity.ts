/** Automatic project identities shared by sidebar rows and the appearance editor. */
import type { ProjectColor } from './project-appearance.tsx'

/**
 * Choose a stable color until the user supplies an explicit one.
 * @param key - canonical Workspace identity, unchanged by a display-name edit.
 * @returns an automatic presentation color.
 */
export function automaticProjectColor(key: string): ProjectColor {
  const colors = ['blue', 'violet', 'green', 'amber'] as const
  let hash = 0
  for (const letter of key) hash = (hash * 31 + letter.charCodeAt(0)) >>> 0
  return colors[hash % colors.length] as ProjectColor
}
