import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { IconLayersOutlineRegular, IconListPenOutlineRegular, IconNewChatOutlineRegular, IconFolderOpenRegular, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import { ProjectCover, folderTitle, coverColors, coverIcons } from './ProjectCover'
import { ProjectAppearanceDialog } from './project-appearance'
import { automaticProjectColor } from './project-identity'
import { chapterList, matchBook, readCover, writeCover } from './library.mjs'
import css from './shelf.module.css'

const same = value => value
const zh = { shelf:'项目书架', library:'藏书目录', browse:'选择项目', search:'搜索书名、别名或分类', chapters:'会话章节', resume:'继续', edit:'编辑封面', new:'新会话', none:'这本书还没有章节', empty:'还没有项目', add:'添加项目', folder:'项目文件夹', next:'下一步', close:'关闭', status:'进行中', done:'已完成', unnamed:'未命名会话', count:'个会话', unmatched:'没有匹配的项目', more:'展开全部章节', less:'收起章节', activity:'待处理', unread:'有新进展', category:'全部分类', path:'输入已有文件夹的绝对路径', loading:'正在载入项目…' }
const en = { shelf:'Project Bookshelf', library:'Book collection', browse:'Choose a project', search:'Find a title, alias or category', chapters:'Chapters', resume:'Resume', edit:'Edit cover', new:'New session', none:'No chapters yet', empty:'No projects yet', add:'Add project', folder:'Project folder', next:'Continue', close:'Close', status:'In progress', done:'Completed', unnamed:'Untitled conversation', count:'sessions', unmatched:'No matching projects', more:'Show all chapters', less:'Show fewer chapters', activity:'Needs attention', unread:'New activity', category:'All categories', path:'Enter the absolute path of an existing folder', loading:'Loading projects…' }

function makeBook(row, saved, sessions, archived) {
  const folder = folderTitle(row.path) || row.title
  const color = saved.color || row.color
  const icon = saved.icon || row.icon
  return {
    id: row.workspaceId, folder, path: row.path,
    name: saved.name || row.title || folder, category: saved.category ?? row.category ?? '',
    status: saved.status || row.status || 'developing', notifications: saved.notifications || row.notifications || 'all',
    color: coverColors.includes(color) ? color : automaticProjectColor(row.workspaceId),
    icon: coverIcons.includes(icon) ? icon : 'folder',
    chapters: chapterList(row.sessionIds, sessions.byId, archived),
  }
}
function Cover({book, copy, signal}) {
  return <ProjectCover {...book} imprint={book.category || (book.status === 'completed' ? copy.done : copy.status)}
    caption={book.chapters.length + ' ' + copy.count} signal={signal}/>
}
function NewChapter({book, actions, useWorkspaceAccess, copy}) {
  const allowed = useWorkspaceAccess(book.id, 'session/create')
  return allowed && <button type="button" aria-label={copy.new} title={copy.new} onClick={() => actions.start(book.id)}><IconNewChatOutlineRegular size={15}/></button>
}
function Shelf({children, wide, useWorkspaces, useSessions, useSessionStatus, useWorkspaceAccess, useRemoteAccess, actions}) {
  const workspaces = useWorkspaces(same)
  const sessions = useSessions(same)
  const statuses = useSessionStatus(same)
  const language = useSyncExternalStore(actions.subscribeLocale, actions.language)
  const chinese = language.toLowerCase().startsWith('zh')
  const copy = chinese ? zh : en
  const [open, setOpen] = useState(true)
  const [catalog, setCatalog] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [selected, select] = useState('')
  const [all, showAll] = useState(false)
  const [edit, setEdit] = useState(null)
  const [path, setPath] = useState(null)
  const [version, refresh] = useState(0)
  const created = useRef(null)
  const id = useId()
  useEffect(() => {
    const update = e => { if (e.key === null || e.key.startsWith('dsh.project-bookshelf.')) refresh(v => v + 1) }
    window.addEventListener('storage', update)
    return () => window.removeEventListener('storage', update)
  }, [])
  const books = useMemo(() => {
    const archived = new Set(workspaces.archivedSessionIds)
    return workspaces.items.map(row => makeBook(row, readCover(window.localStorage, row.workspaceId), sessions, archived))
  }, [workspaces, sessions, version])
  const current = Object.values(sessions.byId).find(s => s.retainedBy?.mainView)?.id
  const book = books.find(b => b.id === selected) || books.find(b => b.chapters.some(s => s.id === current)) || books[0]
  const canCreate = useRemoteAccess('workspace/create')
  const categories = [...new Set(books.map(b => b.category).filter(Boolean))]
  const filtered = books.filter(b => (!category || category === b.category) && matchBook(b, query))
  const openCatalog = () => { setQuery(''); setCategory(''); setCatalog(true) }
  const choose = b => { select(b.id); showAll(false); setCatalog(false); setOpen(true) }
  const first = book?.chapters[0]
  const signal = book && book.notifications !== 'none' && (book.chapters.some(s => statuses.get(s.id)?.pendingInteraction) ? copy.activity
    : book.notifications === 'all' && book.chapters.some(s => statuses.get(s.id)?.completionUnread) ? copy.unread : undefined)
  function saveDraft(value) {
    return (async () => {
      let projectId = edit.id
      if (!projectId) {
        created.current ??= await actions.create(edit.path, value.name)
        projectId = created.current.workspaceId
      }
      writeCover(window.localStorage, projectId, value)
      select(projectId); refresh(v => v + 1)
    })()
  }
  function draftProject(folderPath) {
    created.current = null
    setPath(null); setCatalog(false)
    setEdit({ path:folderPath, name:'', category:'', icon:'folder', color:automaticProjectColor(folderPath), notifications:'all', status:'developing' })
  }
  const toggle = <button type="button" className={css.toggle} title={copy.shelf} aria-label={copy.shelf} aria-expanded={wide ? open : catalog}
    onClick={() => wide ? setOpen(!open) : openCatalog()}><IconLayersOutlineRegular size={17}/>{wide && <><b>{copy.shelf}</b><span>{open ? '⌃' : '⌄'}</span></>}</button>
  return <>
    {wide ? <div className={css.stack}><div className={css.hostRow}>{children}</div>
      <section className={css.shelf} aria-label={copy.shelf} data-bookshelf="">
        <header className={css.tools}>{toggle}{canCreate && <button type="button" aria-label={copy.add} title={copy.add} onClick={() => setPath('')}><IconFolderOpenRegular size={16}/></button>}</header>
        {open && (book ? <div className={css.body}>
          <button type="button" className={css.coverButton} title={copy.browse} aria-label={copy.browse} onClick={openCatalog}><Cover book={book} copy={copy} signal={signal}/></button>
          {first && <button type="button" className={css.resume} onClick={() => actions.open(first.id)}><span>{copy.resume}</span><strong>{first.title || copy.unnamed}</strong><i>›</i></button>}
          <div className={css.chapterHead}><b>{copy.chapters}</b><button type="button" title={copy.edit} aria-label={copy.edit} onClick={() => setEdit(book)}><IconListPenOutlineRegular size={15}/></button>
            <NewChapter book={book} actions={actions} useWorkspaceAccess={useWorkspaceAccess} copy={copy}/></div>
          <div className={css.chapters}>{(all ? book.chapters : book.chapters.slice(0,3)).map((s,index) => <button type="button" key={s.id} aria-current={s.id === current || undefined} onClick={() => actions.open(s.id)}><small>{String(index+1).padStart(2,'0')}</small><span>{s.title || copy.unnamed}</span></button>)}</div>
          {!first && <small className={css.message}>{copy.none}</small>}
          {book.chapters.length > 3 && <button type="button" className={css.more} onClick={() => showAll(!all)}>{all ? copy.less : copy.more}</button>}
        </div> : <p className={css.message}>{workspaces.phase === 'pending' ? copy.loading : copy.empty}</p>)}
      </section></div> : <>{children}{toggle}</>}
    {catalog && <Modal open headless title={copy.library} onClose={() => setCatalog(false)} className={css.catalog}>
      <div className={css.catalogInner} data-bookshelf-catalog=""><header><div><span className={css.kicker}>PROJECT BOOKSHELF</span><h2>{copy.library}</h2></div><button type="button" aria-label={copy.close} onClick={() => setCatalog(false)}>×</button></header>
      <div className={css.filters}><input data-modal-autofocus type="search" aria-label={copy.search} placeholder={copy.search} value={query} onChange={e => setQuery(e.target.value)}/>
        {categories.length > 0 && <select aria-label={copy.category} value={category} onChange={e => setCategory(e.target.value)}><option value="">{copy.category}</option>{categories.map(c => <option key={c}>{c}</option>)}</select>}</div>
      <div className={css.grid}>{filtered.map(b => <button type="button" key={b.id} className={css.coverButton} onClick={() => choose(b)} aria-label={b.name}><Cover book={b} copy={copy}/></button>)}</div>
      {!filtered.length && <p className={css.message}>{books.length ? copy.unmatched : copy.empty}</p>}
      </div></Modal>}
    {path !== null && <Modal open headless title={copy.add} onClose={() => setPath(null)} className={css.pathDialog}><form className={css.pathForm} onSubmit={e => { e.preventDefault(); if(path.trim()) draftProject(path.trim()) }}>
      <h2>{copy.add}</h2><label htmlFor={id}>{copy.path}</label><input id={id} data-modal-autofocus value={path} required onChange={e => setPath(e.target.value)}/>
      <div><button type="button" onClick={() => setPath(null)}>{copy.close}</button><button type="submit">{copy.next}</button></div></form></Modal>}
    {edit && <ProjectAppearanceDialog open mode={edit.id ? 'edit' : 'create'} language={chinese ? 'zh' : 'en'} path={edit.path} defaultName={edit.folder || folderTitle(edit.path)}
      initialValue={edit} categories={categories} onClose={() => setEdit(null)} onSubmit={value => saveDraft({name:value.name,color:value.color,icon:value.icon,category:value.category,notifications:value.notifications,status:value.status})}/>}
  </>
}

export const inject = ['slots','uiWorkspace','workspaces','uiSession','remoteAccess','locale']
export function apply(ctx) {
  ctx.effect(() => {
    const style = document.createElement('style')
    style.dataset.projectBookshelf = ''
    style.textContent = BOOKSHELF_STYLES
    document.head.append(style)
    return () => style.remove()
  })
  const actions = {
    subscribeLocale: listener => ctx.locale.subscribe(listener), language: () => ctx.locale.getLocale().active,
    open: id => ctx.uiWorkspace.openSession(id), start: id => ctx.uiWorkspace.startSession(id),
    create: (path,title) => ctx.workspaces.create({path,title}),
  }
  ctx.slots.inject('sidebar.session.action', () => ctx.slots.register({
    name:'sidebar.session.action', id:'project-bookshelf', order:120, inject:() => ({actions}),
  }, Shelf))
}
