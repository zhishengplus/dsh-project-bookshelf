/** Observe local workspace additions after the initial ready snapshot. */
export function watchNewProjects(source, onAdded) {
  let known
  const update = () => {
    const snapshot = source.getSnapshot()
    if (snapshot.phase !== 'ready') { known = undefined; return }
    const previous = known
    known = new Set(snapshot.items.map(row => row.workspaceId))
    if (previous) for (const row of snapshot.items) {
      // DSH prepares this reserved first-use workspace during startup.
      const automaticDefault = previous.size === 0 && row.title === 'default-workspace'
        && row.path?.split(/[\\/]/).filter(Boolean).at(-1) === 'default-workspace'
      if (automaticDefault) continue
      if (!previous.has(row.workspaceId)) onAdded(row)
    }
  }
  const release = source.subscribe(update)
  update()
  return release
}

/** The desktop bridge and native RPC return a path; browse hosts explicitly decline native picking. */
export async function pickProjectDirectory(desktop, remote) {
  if (desktop) return {kind:'native',path:await desktop.pick()}
  const result = await remote.pick()
  if (result.ok) return {kind:'native',path:result.value}
  if (result.error.code === 'directory-picker/unavailable' && result.error.details?.capability === 'browse') return {kind:'browse'}
  throw new Error(result.error.message)
}
