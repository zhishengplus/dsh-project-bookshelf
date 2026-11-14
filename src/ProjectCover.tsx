import type { CSSProperties } from 'react'
import {
  IconBranchOutlineRegular, IconChecklistOutlineRegular, IconClockOutlineRegular, IconCodeOutlineRegular,
  IconDatabaseOutlineRegular, IconFolderCloseRegular, IconFolderOpenRegular, IconGlobeOutlineRegular,
  IconGoalOutlineRegular, IconLayersOutlineRegular, IconLightOutlineRegular, IconListPenOutlineRegular,
  IconUsersOutlineRegular,
} from '@deepseek-ai/dsh-client-ui-primitives'
import css from './ProjectCover.module.css'

/** Each cover stock has a paper color and a matching high-contrast printing ink. */
const STOCK = {
  blue: ['#b9d4ed', '#173b5a'], violet: ['#d2c4ef', '#49365e'], green: ['#b1d6be', '#224c3c'],
  amber: ['#ead0a5', '#533924'], red: ['#e6b7b1', '#59332e'], neutral: ['#c7d0c7', '#24332f'],
  teal: ['#9fd7d6', '#164a50'], rose: ['#eabdd3', '#623249'], ochre: ['#e3ca83', '#513c16'],
  peach: ['#f1bc9a', '#66391f'], indigo: ['#b7bfdf', '#2c365f'], sage: ['#c9d4a5', '#394921'],
} as const
const GLYPHS = {
  folder: IconFolderCloseRegular, code: IconCodeOutlineRegular, checklist: IconChecklistOutlineRegular,
  layers: IconLayersOutlineRegular, writing: IconListPenOutlineRegular, globe: IconGlobeOutlineRegular,
  data: IconDatabaseOutlineRegular, team: IconUsersOutlineRegular, goal: IconGoalOutlineRegular,
  branch: IconBranchOutlineRegular, time: IconClockOutlineRegular, light: IconLightOutlineRegular,
} as const
export type ProjectColor = keyof typeof STOCK
export type ProjectIcon = keyof typeof GLYPHS
export const coverColors = Object.keys(STOCK) as ProjectColor[]
export const coverIcons = Object.keys(GLYPHS) as ProjectIcon[]

export function coverInk(color?: string): CSSProperties {
  const [cloth, ink] = color && Object.hasOwn(STOCK, color) ? STOCK[color as ProjectColor] : STOCK.neutral
  return { '--cloth': cloth, '--print': ink } as CSSProperties
}

export function CoverGlyph({ icon, size = 16, expanded = false }: {
  icon?: string | undefined; size?: number; expanded?: boolean
}) {
  const Glyph = icon && Object.hasOwn(GLYPHS, icon) ? GLYPHS[icon as ProjectIcon] : GLYPHS.folder
  const Mark = Glyph === GLYPHS.folder && expanded ? IconFolderOpenRegular : Glyph
  return <Mark size={size} aria-hidden="true" />
}

/** Full-size jackets, catalog thumbnails and motif selectors use the same printing plate. */
export function CoverPrint({ icon }: { icon?: string | undefined }) {
  return <span className={css.print} aria-hidden="true" data-cover-print={icon ?? 'folder'}>
    <span className={css.offset}><CoverGlyph icon={icon} size={64} /></span>
    <span className={css.plate}><CoverGlyph icon={icon} size={64} /></span>
  </span>
}

/** The scaled binding and fore-edge keep quick switches, the directory and motif choices recognizable as books. */
export function MiniCover({ icon }: { icon?: string | undefined }) {
  return <span className={css.mini} aria-hidden="true"><CoverPrint icon={icon} /></span>
}

export function folderTitle(path?: string): string {
  return path?.split(/[\\/]/).filter(Boolean).at(-1) ?? path ?? ''
}

/** Prefer natural line breaks at CamelCase and pathname separators over breaking in the middle of a word. */
function BookTitle({ name }: { name: string }) {
  const tokens = name.match(/[A-Z]+(?=[A-Z][a-z])|[A-Z]?[a-z]+|[A-Z]+|[0-9]+|[-_.]+|[^A-Za-z0-9_.-]+/g) ?? [name]
  return <strong className={css.title} data-project-title="" title={name}>
    {tokens.map((token, index) => <span key={index}>{index > 0 && <wbr />}{token}</span>)}
  </strong>
}

export function ProjectCover({ name, folder, color, icon, imprint, caption, signal }: {
  name: string; folder?: string | undefined; color: string; icon?: string | undefined; imprint: string; caption?: string | undefined; signal?: string | undefined
}) {
  const title = folder || name
  return <span className={css.cover} style={coverInk(color)} data-project-cover="" data-color={color}>
    <span className={css.spine} aria-hidden="true" />
    <CoverPrint icon={icon} />
    <span className={css.face}>
      {imprint && <span className={css.imprint}>{imprint}</span>}
      <BookTitle name={title} />
      {name && name !== title && <span className={css.alias} title={name}>{name}</span>}
      {caption && <span className={css.caption}>{caption}</span>}
    </span>
    <span className={css.paper} aria-hidden="true" />
    {signal && <span className={css.signal}>{signal}</span>}
  </span>
}
