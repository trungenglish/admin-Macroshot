/**
 * Illustrative dashboard analytics. Replace with an analytics endpoint when
 * product events and streak aggregates are available from the API.
 */
export const DASHBOARD_METRICS = [
  {
    label: 'All users',
    value: '8,429',
    change: '+8.4%',
    comparison: 'vs. prior 30d',
    icon: 'users',
  },
  {
    label: 'Weekly active',
    value: '2,184',
    change: '+4.2%',
    comparison: 'vs. prior 7d',
    icon: 'activity',
  },
  {
    label: 'Meal plans',
    value: '738',
    change: '+12.8%',
    comparison: 'vs. prior 30d',
    icon: 'calendar',
  },
  {
    label: 'Active streaks',
    value: '742',
    change: '+6.1%',
    comparison: 'current streak users',
    icon: 'flame',
  },
] as const;

export const WEEKLY_FEATURE_ACTIVITY = [
  { week: 'Aug 17', suggestions: 322, plans: 126, favorites: 88 },
  { week: 'Aug 24', suggestions: 354, plans: 139, favorites: 96 },
  { week: 'Aug 31', suggestions: 348, plans: 142, favorites: 103 },
  { week: 'Sep 07', suggestions: 392, plans: 158, favorites: 112 },
  { week: 'Sep 14', suggestions: 408, plans: 164, favorites: 118 },
  { week: 'Sep 21', suggestions: 431, plans: 178, favorites: 126 },
  { week: 'Sep 28', suggestions: 456, plans: 191, favorites: 139 },
  { week: 'Oct 05', suggestions: 482, plans: 205, favorites: 151 },
].map((week) => ({
  ...week,
  total: week.suggestions + week.plans + week.favorites,
}));

export const FEATURE_SNAPSHOT = [
  { label: 'Meal suggestions used', value: '1,777', icon: 'sparkles' },
  { label: 'Meal plans created', value: '738', icon: 'calendar-check' },
  { label: 'Meals saved to favorites', value: '534', icon: 'bookmark' },
] as const;

export const STREAK_SNAPSHOT = [
  { label: '7+ days', value: '318' },
  { label: '30+ days', value: '86' },
  { label: '90+ days', value: '18' },
] as const;

export const INGREDIENT_COVERAGE = {
  complete: 1248,
  total: 1356,
};
