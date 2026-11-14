import assert from 'node:assert/strict'
import test from 'node:test'
import { readCover, writeCover, chapterList, matchBook, buildBooks } from '../src/library.mjs'

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

test('existing memberships and loose conversations survive the bookshelf projection', () => {
  const a={id:'a',title:'Chapter A',updatedAt:1}, b={id:'b',title:'Loose',updatedAt:2}
  const workspace={workspaceId:'p',path:'/work/FolderTitle',title:'Project alias',sessionIds:['a','archived','blank','child']}
  const snapshot={items:[workspace],archivedSessionIds:['archived'],pinnedSessionIds:[]}
  const sessions={ids:['a','b','archived','blank','child'],byId:{a,b,archived:{id:'archived'},blank:{id:'blank',blank:true},child:{id:'child',origin:'subagent'}}}
  const before=JSON.stringify({snapshot,sessions})
  const books=buildBooks(snapshot,sessions,()=>({}),'Ungrouped')
  assert.deepEqual(books.map(b=>b.key),['p','ungrouped'])
  assert.equal(books[0].folder,'FolderTitle')
  assert.equal(books[0].name,'Project alias')
  assert.deepEqual(books[0].chapters.map(s=>s.id),['a'])
  assert.deepEqual(books[1].chapters.map(s=>s.id),['b'])
  assert.equal(JSON.stringify({snapshot,sessions}),before)
})
test('archive filter, pinned ordering and the active blank conversation remain available', () => {
  const rows={a:{id:'a',updatedAt:5},pin:{id:'pin',updatedAt:1},blank:{id:'blank',blank:true,updatedAt:2},old:{id:'old',updatedAt:0}}
  const ids=Object.keys(rows), archived=new Set(['old'])
  assert.deepEqual(chapterList(ids,rows,archived,{current:'blank',pinned:['pin']}).map(s=>s.id),['blank','pin','a'])
  assert.deepEqual(chapterList(ids,rows,archived,{archives:true}).map(s=>s.id),['old'])
})

import {bookActivity} from '../src/library.mjs'
test('project activity counts live conversations once and treats confirmations as waiting',()=>{
 const book={memberIds:['run','run','wait','idle','missing']}
 const statuses=new Map([['run',{running:true}],['wait',{running:true,pendingInteraction:{kind:'approval'}}],['idle',{running:false,completionUnread:true}]])
 assert.deepEqual(bookActivity(book,statuses),{running:1,waiting:1})
 assert.deepEqual(bookActivity(book,new Map()),{running:0,waiting:0})
})
