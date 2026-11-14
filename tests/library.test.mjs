import assert from 'node:assert/strict'
import test from 'node:test'
import { readCover, writeCover, chapterList, matchBook } from '../src/library.mjs'

test('damaged settings fall back and editing one cover preserves the others', () => {
  const data = new Map()
  const storage = { setItem: (k, v) => data.set(k, v), getItem: k => data.get(k) ?? null }
  writeCover(storage, 'first', { color: 'rose' })
  writeCover(storage, 'second', { color: 'amber' })
  assert.deepEqual(readCover(storage, 'first'), { color: 'rose' })
  assert.deepEqual(readCover({ getItem: () => '{' }, 'first'), {})
  assert.deepEqual(readCover(storage, 'second'), { color: 'amber' })
})
test('recent chapters exclude missing, archived, blank and nested sessions', () => {
  const ids = ['a','b','c','d','e','f']
  const rows = { a:{id:'a', updatedAt:1}, b:{id:'b',updatedAt:2}, c:{blank:true}, d:{origin:'subagent'}, e:{} }
  assert.deepEqual(chapterList(ids, rows, new Set(['e'])).map(item => item.id), ['b','a'])
})
test('catalog matches the folder, alias and category', () => {
  const book = {folder:'PaperAtlas',name:'星图',category:'旅行'}
  for (const q of ['ATLAS',' 星图 ','旅行','']) assert.ok(matchBook(book, q))
  assert.equal(matchBook(book,'电台'),false)
})
