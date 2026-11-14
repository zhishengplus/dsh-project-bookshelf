import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import {
  IconChevronRightOutlineRegular, IconCloseOutlineRegular, IconFolderOpenRegular,
  IconLayersOutlineRegular, IconListPenOutlineRegular, IconNewChatOutlineRegular,
  IconSearchOutlineRegular, Modal,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { ProjectCover, MiniCover, coverInk, folderTitle, coverColors, coverIcons } from './ProjectCover'
import { ProjectAppearanceDialog } from './project-appearance'
import { automaticProjectColor } from './project-identity'
import { buildBooks, chapterList, matchBook, readCover, writeCover } from './library.mjs'
import css from './shelf.module.css'

const same = value => value
const zh = { shelf:'项目书架', native:'原版工作区', bookshelf:'书架模式', library:'全部项目', browse:'选择项目', search:'搜索项目、会话或分类', chapters:'会话', resume:'继续', edit:'编辑封面', new:'新会话', none:'这个项目还没有会话', empty:'添加文件夹，开始你的第一本书', add:'添加项目', close:'关闭', status:'开发中', done:'已完成', unnamed:'未命名会话', blank:'新会话', ungrouped:'未分组', count:'个会话', unmatched:'没有匹配的项目或会话', more:'展开其余会话', less:'收起会话', activity:'待处理', running:'进行中', unread:'有新进展', category:'全部分类', path:'项目文件夹路径', loading:'正在载入项目…', archived:'已归档', showArchived:'查看归档', hideArchived:'返回会话', restore:'恢复会话', menu:'会话操作', chooseFolder:'浏览文件夹', useFolder:'使用此文件夹', browseFolder:'选择项目文件夹', parent:'上一级', storage:'无法保存视图设置，请检查浏览器存储权限' }
const en = { shelf:'Project Bookshelf', native:'Original workspace', bookshelf:'Bookshelf mode', library:'All projects', browse:'Choose a project', search:'Search projects, conversations or categories', chapters:'Conversations', resume:'Resume', edit:'Edit cover', new:'New session', none:'No conversations yet', empty:'Add a folder to start your first book', add:'Add project', close:'Close', status:'In progress', done:'Completed', unnamed:'Untitled conversation', blank:'New session', ungrouped:'Ungrouped', count:'sessions', unmatched:'No matching projects or conversations', more:'Show remaining conversations', less:'Show fewer', activity:'Needs attention', running:'Running', unread:'New activity', category:'All categories', path:'Project folder path', loading:'Loading projects…', archived:'Archived', showArchived:'View archives', hideArchived:'Back to conversations', restore:'Restore conversation', menu:'Conversation actions', chooseFolder:'Browse folders', useFolder:'Use this folder', browseFolder:'Choose project folder', parent:'Parent folder', storage:'Cannot save view preference. Check browser storage permissions.' }

function useCopy(actions) {
  const language = useSyncExternalStore(actions.subscribeLocale, actions.language)
  return [language.toLowerCase().startsWith('zh') ? zh : en, language]
}
function NewChapter({book, actions, useWorkspaceAccess, copy}) {
  const allowed = useWorkspaceAccess(book.id, 'session/create')
  return allowed && <button type="button" title={copy.new} aria-label={copy.new} onClick={() => actions.start(book.id)}><IconNewChatOutlineRegular size={16}/></button>
}
function Chapter({session, archived, current, copy, actions, useContextMenu, renderFactorySlot}) {
  const {getTriggerProps} = useContextMenu()
  const [error, setError] = useState('')
  const title = session.blank ? copy.blank : session.title || copy.unnamed
  const target = session.blank ? undefined : {kind:'session',value:{sessionId:session.id,displayTitle:title}}
  return <div className={css.chapter} data-current={current || undefined}>
    <button type="button" className={css.chapterOpen} aria-current={current || undefined}
      {...getTriggerProps(target)} title={title} onClick={() => { if(!archived) actions.open(session.id) }}>
      <span>{title}</span><small>{session.pending ? copy.activity : session.running ? copy.running : session.unread ? '●' : archived ? copy.archived : ''}</small>
    </button>
    <div className={css.chapterActions}>
      {archived && <button type="button" title={copy.restore} aria-label={copy.restore} onClick={() => actions.restore(session.id).catch(e=>setError(e.message))}>↶</button>}
      {target && renderFactorySlot('contextMenu.button',{target,label:copy.menu,className:css.menu})}
    </div>
    {error && <span role="alert" className={css.error}>{error}</span>}
  </div>
}
function FolderBrowser({actions, copy, close, choose}) {
  const [listing, setListing] = useState(null)
  const [path, setPath] = useState('')
  const [error, setError] = useState('')
  const generation = useRef(0)
  async function browse(next) {
    const request = ++generation.current
    setError('')
    try {
      const result = await actions.listDirectory(next)
      if(request === generation.current){setListing(result);setPath(result.path)}
    } catch(e){if(request === generation.current)setError(e.message)}
  }
  useEffect(()=>{void browse();return()=>{generation.current++}},[])
  return <Modal open headless title={copy.browseFolder} onClose={close} className={css.pathDialog}>
    <form className={css.pathForm} onSubmit={e=>{e.preventDefault(); if(path.trim())choose(path.trim())}}>
      <header><h2>{copy.browseFolder}</h2><button type="button" aria-label={copy.close} onClick={close}><IconCloseOutlineRegular size={16}/></button></header>
      <label>{copy.path}<input data-modal-autofocus value={path} required onChange={e=>setPath(e.target.value)}/></label>
      <div className={css.folderTools}><button type="button" onClick={()=>void browse(path)}>{copy.chooseFolder}</button>
        {listing?.crumbs?.length > 1 && <button type="button" onClick={()=>void browse(listing.crumbs.at(-2).path)}>{copy.parent}</button>}</div>
      <div className={css.folders}>{listing?.entries?.filter(entry=>!entry.hidden).map(entry=><button type="button" key={entry.path} onClick={()=>void browse(entry.path)}><IconFolderOpenRegular size={16}/>{entry.name}<span>›</span></button>)}</div>
      {error && <p role="alert" className={css.error}>{error}</p>}
      <footer><button type="button" onClick={close}>{copy.close}</button><button type="submit">{copy.useFolder}</button></footer>
    </form>
  </Modal>
}
function Shelf({wide, expandSidebar, useWorkspaces, useSessions, useSessionStatus, useWorkspaceAccess, useRemoteAccess, useSectionScroller, useContextMenu, renderFactorySlot, actions}) {
  const workspaces = useWorkspaces(same)
  const sessions = useSessions(same)
  const statuses = useSessionStatus(same)
  const [copy, language] = useCopy(actions)
  const {bindScrollerRef} = useSectionScroller()
  const [catalog, setCatalog] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [selected, select] = useState('')
  const [all, showAll] = useState(false)
  const [archives, showArchives] = useState(false)
  const [edit, setEdit] = useState(null)
  const [picking, setPicking] = useState(false)
  const [version, refresh] = useState(0)
  const [error, setError] = useState('')
  const created = useRef(null)
  const previousCurrent = useRef()
  const current = Object.values(sessions.byId).find(s => s.retainedBy?.mainView)?.id
  useEffect(()=>{
    const update = e=>{if(e.key===null || e.key.startsWith('dsh.project-bookshelf.v1.'))refresh(v=>v+1)}
    window.addEventListener('storage',update)
    return ()=>window.removeEventListener('storage',update)
  },[])
  const books = useMemo(()=>buildBooks(workspaces,sessions,id=>readCover(window.localStorage,id),copy.ungrouped).map(b=>({
    ...b,color:coverColors.includes(b.color) ? b.color : automaticProjectColor(b.key),icon:coverIcons.includes(b.icon) ? b.icon : 'folder',
  })),[workspaces,sessions,version,copy])
  useEffect(()=>{
    if(!current)return
    const previous=previousCurrent.current
    previousCurrent.current=current
    if(previous===undefined && selected)return
    const owner=books.find(b=>b.memberIds.includes(current))
    if(owner){select(owner.key);showAll(false)}
  },[current])
  const book = books.find(b=>b.key===selected) || books.find(b=>b.memberIds.includes(current)) || books[0]
  const canCreate = useRemoteAccess('workspace/create')
  const categories = [...new Set(books.map(b=>b.category).filter(Boolean))]
  const needle = query.trim().toLocaleLowerCase()
  const filtered = books.filter(b=>(!category || category===b.category) && (matchBook(b,query) || b.allSessions.some(s=>s.title?.toLocaleLowerCase().includes(needle))))
  const openCatalog = ()=>{setQuery('');setCategory('');setCatalog(true)}
  const choose = b=>{select(b.key);showAll(false);showArchives(false);setCatalog(false);setQuery('')}
  const bookSessions = book ? chapterList(book.memberIds,sessions.byId,new Set(workspaces.archivedSessionIds),{archives,current,pinned:workspaces.pinnedSessionIds}) : []
  const first = book?.chapters.filter(s=>!s.blank).reduce((latest,s)=>!latest || s.updatedAt>latest.updatedAt ? s : latest,undefined)
  const signal = book && book.notifications!=='none' && (book.chapters.some(s=>statuses.get(s.id)?.pendingInteraction) ? copy.activity : book.notifications==='all' && book.chapters.some(s=>statuses.get(s.id)?.completionUnread) ? copy.unread : undefined)
  const adjacent = books.filter(b=>b.key!==book?.key).slice(0,2)
  const visible = (all ? bookSessions : bookSessions.slice(0,12)).map(s=>({...s,pending:statuses.get(s.id)?.pendingInteraction,running:statuses.get(s.id)?.running,unread:statuses.get(s.id)?.completionUnread}))
  function cover(b) {
    return <ProjectCover {...b} imprint={b.category || (b.id ? (b.status==='completed' ? copy.done : copy.status) : '')} caption={b.chapters.filter(s=>!s.blank).length+' '+copy.count} signal={b.key===book?.key ? signal : undefined}/>
  }
  async function save(value) {
    let project = edit
    if(!project.id){
      created.current ??= await actions.create(project.path,value.name)
      project = {...project,id:created.current.workspaceId}
    }
    await actions.save(project.id,value)
    select(project.id);refresh(v=>v+1)
  }
  function draft(path) {
    created.current=null;setPicking(false)
    setEdit({path,name:'',category:'',icon:'folder',color:automaticProjectColor(path),notifications:'all',status:'developing'})
  }
  return <>
    <section ref={wide ? bindScrollerRef : undefined} className={css.shelf} data-bookshelf="" data-wide={wide}>
      {wide ? <>
        <header className={css.toolbar}><strong>{copy.shelf}</strong>
          <button type="button" aria-label={copy.search} title={copy.search} onClick={openCatalog}><IconSearchOutlineRegular size={16}/></button>
          {canCreate && <button type="button" aria-label={copy.add} title={copy.add} onClick={()=>setPicking(true)}><IconFolderOpenRegular size={16}/></button>}
        </header>
        {book ? <>
          <div className={css.volume} style={coverInk(book.color)}>
            <div className={css.jacket}>
              <button type="button" className={css.coverButton} title={copy.browse} aria-label={copy.browse} onClick={openCatalog}>{cover(book)}</button>
              {first && <button type="button" className={css.resume} onClick={()=>actions.open(first.id)}><span>{copy.resume}</span><strong>{first.title || copy.unnamed}</strong><IconChevronRightOutlineRegular size={14}/></button>}
            </div>
          </div>
          <div className={css.switcher}>
            <button type="button" className={css.libraryButton} onClick={openCatalog}><IconLayersOutlineRegular size={15}/>{copy.library}<small>{books.filter(b=>b.id).length}</small><IconChevronRightOutlineRegular size={12}/></button>
            {book.id && <><NewChapter book={book} actions={actions} useWorkspaceAccess={useWorkspaceAccess} copy={copy}/><button type="button" title={copy.edit} aria-label={copy.edit} onClick={()=>setEdit(book)}><IconListPenOutlineRegular size={16}/></button></>}
          </div>
          {adjacent.length>0 && <div className={css.adjacent}>{adjacent.map(b=><button type="button" key={b.key} onClick={()=>choose(b)} style={coverInk(b.color)} title={b.name}><span className={css.miniBook}><MiniCover icon={b.icon}/></span><span>{b.name}</span></button>)}</div>}
          <div className={css.chapterHead}><span>{archives ? copy.archived : copy.chapters}</span><button type="button" title={archives ? copy.hideArchived : copy.showArchived} aria-label={archives ? copy.hideArchived : copy.showArchived} onClick={()=>{showArchives(!archives);showAll(false)}}>{archives ? '↶' : '▤'}</button></div>
          <div className={css.chapters}>{visible.map(s=><Chapter key={s.id} session={s} archived={archives} current={s.id===current} {...{copy,actions,useContextMenu,renderFactorySlot}}/>)}</div>
          {!bookSessions.length && <p className={css.message}>{archives ? copy.archived+' · 0' : copy.none}</p>}
          {bookSessions.length>12 && <button type="button" className={css.more} onClick={()=>showAll(!all)}>{all ? copy.less : copy.more+' '+(bookSessions.length-12)}</button>}
        </> : <p className={css.message}>{workspaces.phase==='pending' ? copy.loading : copy.empty}</p>}
        <button type="button" className={css.switchView} onClick={()=>{try{actions.mode.set(true)}catch{setError(copy.storage)}}}>{copy.native}<IconChevronRightOutlineRegular size={12}/></button>
        {error && <p role="alert" className={css.error}>{error}</p>}
      </> : <button type="button" className={css.rail} aria-label={copy.shelf} title={copy.shelf} onClick={()=>{expandSidebar();openCatalog()}}><IconLayersOutlineRegular size={18}/></button>}
    </section>
    {catalog && <Modal open headless title={copy.library} onClose={()=>{setCatalog(false);setQuery('')}} className={css.catalog}>
      <div className={css.catalogInner} data-bookshelf-catalog="">
        <header><h2>{copy.library}<small>{books.filter(b=>b.id).length}</small></h2><button type="button" aria-label={copy.close} onClick={()=>{setCatalog(false);setQuery('')}}><IconCloseOutlineRegular size={18}/></button></header>
        <div className={css.filters}><input data-modal-autofocus type="search" aria-label={copy.search} placeholder={copy.search} value={query} onChange={e=>setQuery(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter' && !e.nativeEvent.isComposing && filtered[0])choose(filtered[0])}}/>
          {categories.length>0 && <select aria-label={copy.category} value={category} onChange={e=>setCategory(e.target.value)}><option value="">{copy.category}</option>{categories.map(c=><option key={c}>{c}</option>)}</select>}
        </div>
        <div className={css.grid}>{filtered.map(b=><button type="button" key={b.key} className={css.coverButton} aria-pressed={b.key===book?.key} onClick={()=>choose(b)} aria-label={b.name}>{cover(b)}</button>)}</div>
        {!filtered.length && <p className={css.message}>{copy.unmatched}</p>}
      </div>
    </Modal>}
    {picking && <FolderBrowser actions={actions} copy={copy} close={()=>setPicking(false)} choose={draft}/>}
    {edit && <ProjectAppearanceDialog open mode={edit.id ? 'edit':'create'} language={language} path={edit.path} defaultName={edit.folder || folderTitle(edit.path)} initialValue={edit} categories={categories} onClose={()=>setEdit(null)} onSubmit={save}/>}
  </>
}
function ModeButton({children,wide,actions}) {
  const native = useSyncExternalStore(actions.mode.subscribe,actions.mode.get)
  const [copy] = useCopy(actions)
  return <>{children}{native && <button type="button" className={css.returnButton} title={copy.bookshelf} aria-label={copy.bookshelf} onClick={()=>actions.mode.set(false)}><IconLayersOutlineRegular size={16}/>{wide && <span>{copy.bookshelf}</span>}</button>}</>
}
export const inject = ['slots','uiWorkspace','workspaces','uiSession','remoteAccess','locale','contextMenus']
export function apply(ctx) {
  let native = localStorage.getItem('dsh.project-bookshelf.native')==='true'
  const listeners=new Set()
  const mode = {
    get:()=>native,
    subscribe:listener=>{listeners.add(listener);return()=>listeners.delete(listener)},
    set:value=>{
      localStorage.setItem('dsh.project-bookshelf.native',String(value))
      native=value;for(const listener of [...listeners])listener()
    },
  }
  ctx.effect(()=>{
    const style=document.createElement('style');style.dataset.projectBookshelf='';style.textContent=BOOKSHELF_STYLES;document.head.append(style)
    const change=e=>{if(e.key==='dsh.project-bookshelf.native' || e.key===null){native=e.newValue==='true';for(const listener of [...listeners])listener()}}
    window.addEventListener('storage',change)
    return()=>{style.remove();window.removeEventListener('storage',change)}
  })
  const actions = {
    mode,subscribeLocale:listener=>ctx.locale.subscribe(listener),language:()=>ctx.locale.getLocale().active,
    open:id=>ctx.uiWorkspace.openSession(id),start:id=>ctx.uiWorkspace.startSession(id),restore:id=>ctx.uiWorkspace.unarchiveSession(id),
    create:(path,title)=>ctx.workspaces.create({path,title}),listDirectory:path=>ctx.uiWorkspace.listDirectory(path),
    save:async(id,value)=>{
      if(typeof ctx.workspaces.updateMetadata==='function'){
        const {name,...metadata}=value
        await ctx.workspaces.updateMetadata(id,{...metadata,title:name})
      }
      else if(value.name)await ctx.workspaces.rename(id,value.name)
      writeCover(localStorage,id,value)
    },
  }
  ctx.slots.inject('sidebar.workspaces',()=>{
    let release
    const sync=()=>{
      if(native){release?.();release=undefined}
      else if(!release)release=ctx.slots.register({name:'sidebar.workspaces',priority:-100,inject:()=>({actions})},Shelf)
    }
    sync();const unsubscribe=mode.subscribe(sync)
    return()=>{unsubscribe();release?.()}
  })
  ctx.slots.inject('sidebar.session.action',()=>ctx.slots.register({name:'sidebar.session.action',id:'project-bookshelf.mode',order:120,inject:()=>({actions})},ModeButton))
}
