import test from 'node:test'
import assert from 'node:assert/strict'
import {watchNewProjects, pickProjectDirectory} from '../src/project-flow.mjs'

test('initial and reconnected workspaces are not treated as new projects', () => {
  let snapshot = {phase:'ready',items:[{workspaceId:'existing'}]}
  const listeners = new Set(), added = []
  const source = {getSnapshot:()=>snapshot, subscribe:f=>{listeners.add(f);return()=>listeners.delete(f)}}
  const set = value => {snapshot=value; for(const f of listeners)f()}
  const release = watchNewProjects(source,row=>added.push(row.workspaceId))
  set({phase:'ready',items:[{workspaceId:'existing'},{workspaceId:'new'}]})
  set(snapshot)
  set({phase:'ready',items:[...snapshot.items,{workspaceId:'second'}]})
  assert.deepEqual(added,['new','second'])
  set({phase:'connecting',items:[]})
  set({phase:'ready',items:[{workspaceId:'after-reconnect'}]})
  assert.deepEqual(added,['new','second'])
  release()
  set({phase:'ready',items:[...snapshot.items,{workspaceId:'disposed'}]})
  assert.equal(listeners.size,0)
  assert.deepEqual(added,['new','second'])
})

test('desktop, canceled native selection, and remote browse choose their supported interaction', async () => {
  let calls=0
  const remote={pick:async()=>{calls++;return {ok:true,value:null}}}
  assert.deepEqual(await pickProjectDirectory({pick:async()=>'/book'},remote),{kind:'native',path:'/book'})
  assert.equal(calls,0)
  assert.deepEqual(await pickProjectDirectory(undefined,remote),{kind:'native',path:null})
  assert.deepEqual(await pickProjectDirectory(undefined,{pick:async()=>({ok:false,error:{code:'directory-picker/unavailable',details:{capability:'browse'}}})}),{kind:'browse'})
  await assert.rejects(()=>pickProjectDirectory(undefined,{pick:async()=>({ok:false,error:{code:'permission-denied',message:'Selection denied'}})}),/Selection denied/)
})

test('DSH first-use preparation leaves onboarding clear and subsequent additions open setup', () => {
  let snapshot={phase:'ready',items:[]},notify
  const source={getSnapshot:()=>snapshot,subscribe:f=>{notify=f;return()=>{}}}
  const added=[]
  watchNewProjects(source,row=>added.push(row.workspaceId))
  snapshot={phase:'ready',items:[{workspaceId:'default',title:'default-workspace',path:'/Documents/DeepSeek Harness/default-workspace'}]};notify()
  snapshot={phase:'ready',items:[...snapshot.items,{workspaceId:'first-user-project',title:'My book',path:'/my-book'}]};notify()
  assert.deepEqual(added,['first-user-project'])
})
