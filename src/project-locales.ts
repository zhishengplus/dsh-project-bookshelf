/** Local dictionaries for the project naming and appearance controls. */
export const projectZh = {
  'project.create.title': '新建项目',
  'project.edit.title': '项目外观设置',
  'project.create.action': '创建项目',
  'project.edit.action': '保存设置',
  'project.name.label': '项目名称',
  'project.name.placeholder': '使用文件夹名称',
  'project.color.label': '颜色',
  'project.color.blue': '蓝色',
  'project.color.violet': '紫色',
  'project.color.green': '绿色',
  'project.color.amber': '橙色',
  'project.color.red': '红色',
  'project.color.neutral': '灰色',
  'project.icon.label': '图标',
  'project.icon.folder': '文件夹',
  'project.icon.code': '代码',
  'project.icon.checklist': '清单',
  'project.icon.layers': '分层',
  'project.color.teal': '青瓷',
  'project.color.rose': '蔷薇',
  'project.color.ochre': '麦金',
  'project.color.peach': '杏桃',
  'project.color.indigo': '靛青',
  'project.color.sage': '鼠尾草',
  'project.icon.writing': '写作',
  'project.icon.globe': '网站',
  'project.icon.data': '数据',
  'project.icon.team': '协作',
  'project.icon.goal': '目标',
  'project.icon.branch': '分支',
  'project.icon.time': '日程',
  'project.icon.light': '灵感',
  'project.options': '书封提醒与状态',
  'project.preview.directory': '项目文件夹',
  'project.preview.cover': '书架封面',
  'project.category.label': '分类标签',
  'project.category.placeholder': '例如：工作、个人',
  'project.notifications.label': '书封提醒',
  'project.notifications.all': '全部通知',
  'project.notifications.mentions': '仅待处理事项',
  'project.notifications.none': '不通知',
  'project.status.label': '项目状态',
  'project.status.developing': '开发中',
  'project.status.completed': '已完成',
  'project.remove.action': '移除项目',
  'project.remove.confirm': '只移除这本书的项目登记，文件夹和其中的会话历史都会保留。',
  'project.cancel': '取消',
  'project.close': '关闭',
  'project.studio.subtitle': '预览项目外观，区分不同工作',
  'project.preview.label': '项目实时预览',
  'project.preview.session': '项目会话',
  'project.preview.description': '颜色、图标与分类会显示在项目侧栏，方便一眼找到正在做的事',
  'project.studio.saveHint': '保存后应用到侧栏',

} satisfies Record<string, string>

/** Project locale key union. */
export type ProjectLocaleKey = keyof typeof projectZh

/** Complete English counterpart. */
export const projectEn: Record<ProjectLocaleKey, string> = {
  'project.create.title': 'New project',
  'project.edit.title': 'Project appearance',
  'project.create.action': 'Create project',
  'project.edit.action': 'Save settings',
  'project.name.label': 'Project name',
  'project.name.placeholder': 'Use folder name',
  'project.color.label': 'Color',
  'project.color.blue': 'Blue',
  'project.color.violet': 'Violet',
  'project.color.green': 'Green',
  'project.color.amber': 'Amber',
  'project.color.red': 'Red',
  'project.color.neutral': 'Gray',
  'project.icon.label': 'Icon',
  'project.icon.folder': 'Folder',
  'project.icon.code': 'Code',
  'project.icon.checklist': 'Checklist',
  'project.icon.layers': 'Layers',
  'project.color.teal': 'Teal',
  'project.color.rose': 'Rose',
  'project.color.ochre': 'Wheat',
  'project.color.peach': 'Apricot',
  'project.color.indigo': 'Indigo',
  'project.color.sage': 'Sage',
  'project.icon.writing': 'Writing',
  'project.icon.globe': 'Web',
  'project.icon.data': 'Data',
  'project.icon.team': 'Team',
  'project.icon.goal': 'Goal',
  'project.icon.branch': 'Branch',
  'project.icon.time': 'Schedule',
  'project.icon.light': 'Ideas',
  'project.options': 'Cover alerts and status',
  'project.preview.directory': 'Project folder',
  'project.preview.cover': 'Shelf cover',
  'project.category.label': 'Category tag',
  'project.category.placeholder': 'For example: Work, Personal',
  'project.notifications.label': 'Cover alerts',
  'project.notifications.all': 'All notifications',
  'project.notifications.mentions': 'Pending requests only',
  'project.notifications.none': 'No notifications',
  'project.status.label': 'Project status',
  'project.status.developing': 'Developing',
  'project.status.completed': 'Completed',
  'project.remove.action': 'Remove project',
  'project.remove.confirm': 'Only this project registration is removed. The folder and its conversations are kept.',
  'project.cancel': 'Cancel',
  'project.close': 'Close',
  'project.studio.subtitle': 'Preview the identity of your project',
  'project.preview.label': 'Live project preview',
  'project.preview.session': 'Project conversation',
  'project.preview.description': 'Color, icon and category appear in your sidebar, so each project is easy to find',
  'project.studio.saveHint': 'Save to apply in the sidebar',

}

/** Translate project copy, with an English fallback before the main locale adds these keys. */
export type ProjectTranslate = (key: ProjectLocaleKey) => string

/**
 * Resolve a host translate seat and its current document language.
 * @param language - active document language tag; zh* reads the zh dictionary, others read English.
 * @param t - optional host translate seat consulted before the local dictionaries.
 * @returns translate function over project locale keys.
 */
export function projectTranslate(language: string, t?: ProjectTranslate): ProjectTranslate {
  return (key) => {
    const translated = t?.(key)
    return translated !== undefined && translated !== key
      ? translated
      : (language.toLowerCase().startsWith('zh') ? projectZh[key] : projectEn[key])
  }
}

/**
 * Read the active document language for the project control fallback dictionaries.
 * @returns the html lang tag, defaulting to zh-CN without a document.
 */
export function documentLanguage(): string {
  return typeof document === 'undefined' ? 'zh-CN' : document.documentElement.lang || 'zh-CN'
}
