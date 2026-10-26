import { SORT_OPTIONS } from '../topics.js';

export const MODULE_SORT = 'modules';

export const MODULE_SORT_OPTIONS = [{ id: MODULE_SORT, label: 'Por módulos' }, ...SORT_OPTIONS];

export function categoryTopics(catalog, categoryId) {
  return catalog.filter((topic) => topic.categoryId === categoryId);
}

export function buildVisibleModules(category, topicsById) {
  return [...(category.modules || [])]
    .sort((a, b) => a.order - b.order)
    .map((module) => ({
      ...module,
      topics: (module.topicIds || []).map((id) => topicsById.get(id)).filter(Boolean),
    }))
    .filter((module) => module.topics.length > 0);
}

export function defaultSortFor(hasModules) {
  return hasModules ? MODULE_SORT : 'recent';
}

export function sortOptionsFor(hasModules) {
  return hasModules ? MODULE_SORT_OPTIONS : SORT_OPTIONS;
}

export function formatDays(days) {
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  return `Hace ${days} días`;
}
