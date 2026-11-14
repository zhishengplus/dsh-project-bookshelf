/** Controlled project naming, appearance, category, and notification form. */
import { useId, useRef, useState } from 'react'
import {
  Button, IconCheckOutlineRegular, IconCloseOutlineRegular, IconTrashOutlineRegular, Input, Modal,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { projectTranslate, type ProjectTranslate } from './project-locales.ts'
import { MiniCover, ProjectCover, coverColors, coverIcons, coverInk, folderTitle, type ProjectColor, type ProjectIcon } from './ProjectCover.tsx'
import css from './project-appearance.module.css'

export type { ProjectColor, ProjectIcon } from './ProjectCover.tsx'
/** Notification levels selectable for a project. */
export type ProjectNotificationMode = 'all' | 'mentions' | 'none'
/** Selectable project lifecycle shown as the project's completion badge. */
export type ProjectStatus = 'developing' | 'completed'

/** All editable appearance values; an empty name means the folder name. */
export interface ProjectAppearanceValue {
  name: string
  color: ProjectColor
  icon: ProjectIcon
  category: string
  notifications: ProjectNotificationMode
  status: ProjectStatus
}

/** Directory and appearance values submitted when creating a project. */
export interface ProjectCreation extends ProjectAppearanceValue {
  path: string
}

const NOTIFICATIONS: readonly ProjectNotificationMode[] = ['all', 'mentions', 'none']
const STATUSES: readonly ProjectStatus[] = ['developing', 'completed']

/** Pure form inputs supplied by a host; no store or service dependency. */
export interface ProjectAppearanceProps {
  value: ProjectAppearanceValue
  defaultName: string
  onChange: (value: ProjectAppearanceValue) => void
  disabled?: boolean
  categories?: readonly string[] | undefined
  /** Existing host translation seat; missing keys use project-locales. */
  t?: ProjectTranslate | undefined
  language?: string | undefined
}

/** Render the controlled project form. */
export function ProjectAppearance({
  value, defaultName, onChange, disabled = false, t, language = 'zh-CN', categories = [],
}: ProjectAppearanceProps) {
  const text = projectTranslate(language, t)
  const listId = useId()
  const suggestions = [...new Set(categories.map(category => category.trim()).filter(Boolean))]
  const update = <K extends keyof ProjectAppearanceValue>(key: K, next: ProjectAppearanceValue[K]): void => {
    onChange({ ...value, [key]: next })
  }
  return <div className={css.form}>
    <label className={css.field}>
      <span className={css.label}>{text('project.name.label')}</span>
      <Input value={value.name} placeholder={defaultName || text('project.name.placeholder')}
        aria-label={text('project.name.label')} disabled={disabled} maxLength={120} data-modal-autofocus
        onChange={(event) => { update('name', event.target.value) }} />
    </label>
    <fieldset className={css.field} disabled={disabled}>
      <legend className={css.label}>{text('project.color.label')}</legend>
      <div className={css.swatches}>
        {coverColors.map(color => <button key={color} type="button" className={css.swatch} data-color={color}
          style={coverInk(color)} title={text(`project.color.${color}`)}
          aria-label={text(`project.color.${color}`)} aria-pressed={value.color === color} disabled={disabled}
          onClick={() => { update('color', color) }}>
          <span className={css.swatchPaint} />
          {value.color === color && <IconCheckOutlineRegular size={12} />}
        </button>)}
      </div>
    </fieldset>
    <fieldset className={css.field} disabled={disabled}>
      <legend className={css.label}>{text('project.icon.label')}</legend>
      <div className={css.icons} style={coverInk(value.color)}>
        {coverIcons.map(icon => <button key={icon} type="button" className={css.iconOption}
            aria-label={text(`project.icon.${icon}`)} aria-pressed={value.icon === icon} disabled={disabled}
            onClick={() => { update('icon', icon) }}>
            <span className={css.sample}><MiniCover icon={icon} /></span>
            <span>{text(`project.icon.${icon}`)}</span>
          </button>)}
      </div>
    </fieldset>
    <label className={css.field}>
      <span className={css.label}>{text('project.category.label')}</span>
      <Input value={value.category} placeholder={text('project.category.placeholder')}
        list={suggestions.length ? listId : undefined}
        aria-label={text('project.category.label')} disabled={disabled} maxLength={40}
        onChange={(event) => { update('category', event.target.value) }} />
    </label>
    {suggestions.length > 0 && <datalist id={listId}>{suggestions.map(category => <option key={category} value={category} />)}</datalist>}
    <details className={css.advanced}>
      <summary>{text('project.options')}<span>{text(`project.notifications.${value.notifications}`)} · {text(`project.status.${value.status}`)}</span></summary>
      <fieldset className={css.field} disabled={disabled}>
      <legend className={css.label}>{text('project.notifications.label')}</legend>
      <div className={css.notifications}>
        {NOTIFICATIONS.map(mode => <button key={mode} type="button" className={css.notification}
          aria-pressed={value.notifications === mode} disabled={disabled}
          onClick={() => { update('notifications', mode) }}>
          <span className={css.choiceDot} aria-hidden="true">{value.notifications === mode && <IconCheckOutlineRegular size={10} />}</span>
          <span>{text(`project.notifications.${mode}`)}</span>
        </button>)}
      </div>
    </fieldset>
      <fieldset className={css.field} disabled={disabled}>
        <legend className={css.label}>{text('project.status.label')}</legend>
        <div className={css.statusChoices}>
          {STATUSES.map(status => <button key={status} type="button" className={css.statusOption}
            aria-pressed={value.status === status} disabled={disabled}
            onClick={() => { update('status', status) }}>{text(`project.status.${status}`)}</button>)}
        </div>
      </fieldset>
    </details>
  </div>
}

/** Standalone project create/edit modal; the host owns persistence and closure after success. */
export interface ProjectAppearanceDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  defaultName: string
  path?: string | undefined
  categories?: readonly string[] | undefined
  initialValue: ProjectAppearanceValue
  onSubmit: (value: ProjectAppearanceValue) => void | Promise<void>
  /** Removes the project registration only; omit to hide the removal control. */
  onRemove?: (() => Promise<void>) | undefined
  onClose: () => void
  t?: ProjectTranslate | undefined
  language?: string | undefined
}

/** Render a keyed-by-open project modal, retaining draft and error after failed submissions. */
export function ProjectAppearanceDialog(props: ProjectAppearanceDialogProps) {
  return props.open ? <ProjectAppearanceDialogContent {...props} /> : null
}

function ProjectAppearanceDialogContent({
  mode, defaultName, initialValue, path, categories, onSubmit, onRemove, onClose, t, language = 'zh-CN',
}: ProjectAppearanceDialogProps) {
  const text = projectTranslate(language, t)
  const [value, setValue] = useState(initialValue)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const saving = useRef(false)
  const folder = folderTitle(path) || defaultName
  const close = (): void => { if (!pending) onClose() }
  const change = (next: ProjectAppearanceValue): void => { setValue(next); setError(null) }
  const submit = async (): Promise<void> => {
    if (saving.current) return
    saving.current = true
    setPending(true)
    setError(null)
    try {
      await onSubmit({ ...value, name: value.name.trim() || folder, category: value.category.trim() })
      onClose()
    } catch (reason: unknown) {
      saving.current = false
      setError(reason instanceof Error ? reason.message : String(reason))
      setPending(false)
    }
  }
  const remove = async (): Promise<void> => {
    if (onRemove === undefined || saving.current) return
    saving.current = true
    setPending(true)
    setError(null)
    try {
      await onRemove()
      onClose()
    } catch (reason: unknown) {
      saving.current = false
      setConfirming(false)
      setError(reason instanceof Error ? reason.message : String(reason))
      setPending(false)
    }
  }
  return <Modal headless open onClose={close}
    title={text(mode === 'create' ? 'project.create.title' : 'project.edit.title')}
    className={css.dialog as string}>
    <header className={css.dialogHeader}>
      <div>
        <h2>{text(mode === 'create' ? 'project.create.title' : 'project.edit.title')}</h2>
      </div>
      <button type="button" className={css.closeButton} aria-label={text('project.close')} disabled={pending} onClick={close}>
        <IconCloseOutlineRegular size={16} />
      </button>
    </header>
    <form className={css.dialogForm} onSubmit={event => { event.preventDefault(); void submit() }}
      onKeyDown={event => {
        if (event.key !== 'Enter') return
        if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return
        if (event.ctrlKey || event.metaKey) { event.preventDefault(); void submit() }
      }}>
    <div className={css.workbench} data-color={value.color}>
      <aside className={css.preview} data-project-preview="" data-color={value.color} data-status={value.status}>
        <span className={css.previewEyebrow}>{text('project.preview.cover')}</span>
        <div className={css.proof} style={coverInk(value.color)}>
          <ProjectCover folder={folder} name={value.name.trim() || folder} icon={value.icon} color={value.color}
            imprint={value.category.trim() || text(`project.status.${value.status}`)}
            caption={value.category.trim() ? text(`project.status.${value.status}`) : undefined} />
        </div>
        {path && <div className={css.directory}><span>{text('project.preview.directory')}</span><bdi title={path}>{folder}</bdi></div>}
      </aside>
      <section className={css.editor}>
        <ProjectAppearance value={value} defaultName={folder} onChange={change} disabled={pending} t={t} language={language} categories={categories} />
        {error !== null && <div className={css.error} role="alert">{error}</div>}
      </section>
    </div>
    {confirming && <div className={css.removeConfirm} role="alert">
      <p>{text('project.remove.confirm')}</p>
      <div className={css.removeActions}>
        <Button type="button" variant="outline" disabled={pending} onClick={() => { setConfirming(false) }}>{text('project.cancel')}</Button>
        <button type="button" className={css.removeConfirmButton} disabled={pending} onClick={() => { void remove() }}>
          {text('project.remove.action')}
        </button>
      </div>
    </div>}
    <footer className={css.dialogFooter}>
      {onRemove !== undefined && !confirming && <button type="button" className={css.removeButton} disabled={pending}
        onClick={() => { setConfirming(true) }}>
        <IconTrashOutlineRegular size={14} />{text('project.remove.action')}
      </button>}
      <Button type="button" variant="outline" disabled={pending} onClick={close}>{text('project.cancel')}</Button>
      <Button type="submit" variant="primary" disabled={pending} aria-busy={pending}>
        {text(mode === 'create' ? 'project.create.action' : 'project.edit.action')}
      </Button>
    </footer>
    </form>
  </Modal>
}
