import test from 'node:test'
import assert from 'node:assert/strict'
import {registerProjectMenus,projectMenuTarget} from '../src/project-menu.mjs'
test('project menu owns dialogs, respects target permissions and preserves native folder actions',async()=>{
 let contribution,selected,disposals=0
 const requests=[],book={id:'own',name:'Notebook',path:'/notebook'},permissions=new Set(['rename'])
 const ctx={effect:f=>f(),locale:{getLocale:()=>({active:'zh-CN'})},workspaces:{list:{getSnapshot:()=>({items:[{workspaceId:'own'}]})}},remoteAccess:{source:(_kind,id,action)=>({getSnapshot:()=>id==='own' && permissions.has(action.split('/')[1])})},contextMenus:{register:c=>{contribution=c},resolve:target=>{assert.equal(target.value.workspaceId,'own');return {ready:Promise.resolve(),source:{getSnapshot:()=>[{id:'workspace.rename/rename'},{id:'workspace.appearance/appearance'},{id:'open-in-app.workspace/reveal',label:'在文件夹显示'},{id:'workspace.delete/delete'}]},select:id=>{selected=id},dispose:()=>disposals++}}}}
 registerProjectMenus(ctx,request=>requests.push(request))
 assert.equal(projectMenuTarget({}),undefined)
 assert.equal(projectMenuTarget(book).value,book)
 const entries=await contribution.resolve(book,new AbortController().signal)
 assert.deepEqual(entries.map(e=>e.id),['rename','settings','open-in-app.workspace/reveal'])
 entries[0].run();assert.equal(requests[0].book,book);assert.equal(requests[0].action,'rename')
 await entries[2].run();assert.equal(selected,'open-in-app.workspace/reveal');assert.equal(disposals,2)
 permissions.clear();permissions.add('delete')
 const limited=await contribution.resolve(book,new AbortController().signal)
 assert.deepEqual(limited.map(e=>e.id),['settings','open-in-app.workspace/reveal','delete'])
 assert.equal(limited.at(-1).danger,true)
 assert.deepEqual(await contribution.resolve({...book,id:'removed'},new AbortController().signal),[])
})
