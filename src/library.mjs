const prefix = 'dsh.project-bookshelf.v1.'
export function readCover(storage, id) {
  try {
    const value = JSON.parse(storage.getItem(prefix + id))
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch { return {} }
}

export function writeCover(storage, id, value) {
  storage.setItem(prefix + id, JSON.stringify(value))
}

export function chapterList(ids, byId, archived, {archives = false, current, pinned = []} = {}) {
  const pins = new Set(pinned)
  return ids.filter(id => archived.has(id) === archives).map(id => byId[id])
    .filter(session => session && (!session.blank || (current !== undefined && session.id === current)) && session.origin !== 'subagent')
    .sort((a, b) => Number(b.id === current && b.blank) - Number(a.id === current && a.blank)
      || Number(pins.has(b.id)) - Number(pins.has(a.id)) || b.updatedAt - a.updatedAt)
}

export function buildBooks(workspaces, sessions, saved, ungroupedName) {
  const archived = new Set(workspaces.archivedSessionIds)
  const current = Object.values(sessions.byId).find(s => s.retainedBy?.mainView)?.id
  const grouped = new Set(workspaces.items.flatMap(row => row.sessionIds))
  const loose = sessions.ids.filter(id => !grouped.has(id) && sessions.byId[id]?.origin !== 'subagent')
  const rows = [...workspaces.items]
  if (loose.length) rows.push({path:'',title:ungroupedName,sessionIds:loose})
  return rows.map(row => {
    const key = row.workspaceId || 'ungrouped'
    const value = saved(key)
    const text = (field, fallback) => typeof value[field] === 'string' ? value[field] : row[field] || fallback
    const name = text('name',row.title)
    return {
      key,id:row.workspaceId,path:row.path,folder:row.path.split(/[\\/]/).filter(Boolean).at(-1) || name,
      name,category:text('category',''),color:text('color',''),icon:text('icon','folder'),
      status:text('status','developing'),notifications:text('notifications','all'),
      memberIds:row.sessionIds,allSessions:row.sessionIds.map(id=>sessions.byId[id]).filter(Boolean),
      chapters:chapterList(row.sessionIds,sessions.byId,archived,{current,pinned:workspaces.pinnedSessionIds}),
    }
  })
}

export function matchBook(book, query) {
  const needle = query.trim().toLocaleLowerCase()
  return [book.folder, book.name, book.category].some(value => value.toLocaleLowerCase().includes(needle))
}

/** Running and waiting are separate facts; a pending confirmation pauses the spinner. */
export function bookActivity(book, statuses) {
  let running=0,waiting=0
  for(const id of new Set(book.memberIds)) {
    const status=statuses.get(id)
    if(status?.pendingInteraction)waiting++
    else if(status?.running)running++
  }
  return {running,waiting}
}
