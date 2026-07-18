import { BookOpen, Newspaper, Monitor, Users, Trophy, Shirt, Map } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavigationItem {
	key: string // 用于翻译键，如 'guide' -> t('nav.guide')
	path: string // URL 路径，如 '/guide'
	icon: LucideIcon // Lucide 图标组件
	isContentType: boolean // 是否对应 content/ 目录
}

// 导航配置：Super Battle Golf 的 7 个内容分类（community 不进导航栏）
export const NAVIGATION_CONFIG: NavigationItem[] = [
	{ key: 'guide', path: '/guide', icon: BookOpen, isContentType: true },
	{ key: 'updates', path: '/updates', icon: Newspaper, isContentType: true },
	{ key: 'platforms', path: '/platforms', icon: Monitor, isContentType: true },
	{ key: 'multiplayer', path: '/multiplayer', icon: Users, isContentType: true },
	{ key: 'achievements', path: '/achievements', icon: Trophy, isContentType: true },
	{ key: 'cosmetics', path: '/cosmetics', icon: Shirt, isContentType: true },
	{ key: 'maps', path: '/maps', icon: Map, isContentType: true },
]

// 从配置派生内容类型列表（用于路由和内容加载）
export const CONTENT_TYPES = NAVIGATION_CONFIG.filter((item) => item.isContentType).map(
	(item) => item.path.slice(1),
) // 移除开头的 '/' -> ['guide', 'updates', 'platforms', ...]

export type ContentType = (typeof CONTENT_TYPES)[number]

// 辅助函数：验证内容类型
export function isValidContentType(type: string): type is ContentType {
	return CONTENT_TYPES.includes(type as ContentType)
}
