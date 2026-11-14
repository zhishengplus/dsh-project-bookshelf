/** Bookshelf menus own dialogs because the replaced workspace row is unmounted. */
export const projectMenuTarget = book => book?.id ? {kind:'bookshelf-project',value:book} : undefined

export function registerProjectMenus(ctx,request) {
  ctx.effect(()=>ctx.contextMenus.register({
    id:'project-bookshelf.actions',target:'bookshelf-project',order:100,
    observe:book=>[ctx.workspaces.list,ctx.locale,...['rename','delete'].map(action=>ctx.remoteAccess.source('workspace',book.id,'workspace/'+action))],
    resolve:async(book,signal)=>{
      if(!ctx.workspaces.list.getSnapshot().items.some(row=>row.workspaceId===book.id))return []
      const zh=ctx.locale.getLocale().active.toLowerCase().startsWith('zh')
      const allowed=action=>ctx.remoteAccess.source('workspace',book.id,'workspace/'+action).getSnapshot()
      const entries=[]
      if(allowed('rename'))entries.push({id:'rename',label:zh?'重命名':'Rename',icon:{key:'workspace.rename'},run:()=>request({action:'rename',book})})
      entries.push({id:'settings',label:zh?'项目设置':'Project settings',icon:{key:'project-bookshelf.settings'},run:()=>request({action:'settings',book})})
      // Keep the host's folder-manager availability, permissions and third-party actions.
      const target={kind:'workspace',value:{workspaceId:book.id,path:book.path,displayTitle:book.name}}
      const native=ctx.contextMenus.resolve(target)
      let views
      try{await native.ready;signal.throwIfAborted();views=native.source.getSnapshot()}finally{native.dispose()}
      const convert=view=>({...view,children:view.children?.map(convert),run:async()=>{
        const fresh=ctx.contextMenus.resolve(target)
        try{await fresh.ready;fresh.select(view.id)}finally{fresh.dispose()}
      }})
      entries.push(...views.filter(view=>!['workspace.rename','workspace.delete','workspace.appearance'].some(owner=>view.id.includes(encodeURIComponent(owner)+'/'))).map(convert))
      if(allowed('delete'))entries.push({id:'delete',label:zh?'删除工作区':'Remove workspace',icon:{key:'workspace.delete'},danger:true,separatorBefore:true,run:()=>request({action:'delete',book})})
      return entries
    },
  }))
}
