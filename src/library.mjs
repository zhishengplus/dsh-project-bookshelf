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

export function chapterList(ids, byId, archived) {
  return ids.filter(id => !archived.has(id)).map(id => byId[id])
    .filter(session => session && !session.blank && session.origin !== 'subagent')
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export function matchBook(book, query) {
  const needle = query.trim().toLocaleLowerCase()
  return [book.folder, book.name, book.category].some(value => value.toLocaleLowerCase().includes(needle))
}
