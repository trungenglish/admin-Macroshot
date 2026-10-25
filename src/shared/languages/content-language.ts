export const CONTENT_LANGUAGES = ['vi', 'zh', 'en'] as const;

export type ContentLanguage = (typeof CONTENT_LANGUAGES)[number];

export const CONTENT_LANGUAGE_LABELS: Record<ContentLanguage, string> = {
  vi: 'Tiếng Việt',
  zh: '中文',
  en: 'English',
};

export function normalizeContentLanguages(value: unknown): ContentLanguage[] {
  if (!Array.isArray(value)) return [];

  return CONTENT_LANGUAGES.filter((language) =>
    value.some((candidate) => candidate === language),
  );
}

export function isContentLanguage(value: string): value is ContentLanguage {
  return CONTENT_LANGUAGES.some((language) => language === value);
}
