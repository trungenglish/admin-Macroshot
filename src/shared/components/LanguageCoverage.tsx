import { Badge } from '@/components/ui/badge';
import {
  CONTENT_LANGUAGES,
  CONTENT_LANGUAGE_LABELS,
  type ContentLanguage,
} from '@/shared/languages/content-language';

export function LanguageCoverage({
  availableLanguages,
}: {
  availableLanguages?: ContentLanguage[];
}): React.JSX.Element {
  const available = new Set(availableLanguages ?? []);

  return (
    <div
      className='flex flex-wrap items-center gap-1.5'
      aria-label='Translation coverage'
    >
      {CONTENT_LANGUAGES.map((language) => {
        const hasTranslation = available.has(language);
        return (
          <Badge
            key={language}
            variant={hasTranslation ? 'outline' : 'secondary'}
            className={
              hasTranslation
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'text-muted-foreground'
            }
            title={`${CONTENT_LANGUAGE_LABELS[language]}: ${hasTranslation ? 'Available' : 'Missing'}`}
          >
            <span>{language.toUpperCase()}</span>
            <span aria-hidden='true'>{hasTranslation ? '✓' : '—'}</span>
            <span className='sr-only'>
              {CONTENT_LANGUAGE_LABELS[language]}:{' '}
              {hasTranslation ? 'available' : 'missing'}
            </span>
          </Badge>
        );
      })}
    </div>
  );
}

export function ContentLanguagePicker({
  availableLanguages,
  value,
  onChange,
}: {
  availableLanguages?: ContentLanguage[];
  value: ContentLanguage;
  onChange(language: ContentLanguage): void;
}): React.JSX.Element {
  const available = new Set(availableLanguages ?? []);

  return (
    <div
      role='group'
      aria-label='Content language'
      className='flex flex-wrap gap-2'
    >
      {CONTENT_LANGUAGES.map((language) => {
        const hasTranslation = available.has(language);
        return (
          <button
            key={language}
            type='button'
            aria-pressed={value === language}
            aria-label={`${CONTENT_LANGUAGE_LABELS[language]}: ${hasTranslation ? 'available' : 'missing'}`}
            onClick={() => onChange(language)}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${value === language ? 'border-primary bg-primary/5 font-medium text-foreground' : 'border-input bg-background text-muted-foreground hover:bg-muted'}`}
          >
            <span>{CONTENT_LANGUAGE_LABELS[language]}</span>
            <span
              aria-hidden='true'
              className={
                hasTranslation
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-muted-foreground'
              }
            >
              {hasTranslation ? '✓' : '—'}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function MissingLanguagePanel({
  language,
}: {
  language: ContentLanguage;
}): React.JSX.Element {
  return (
    <div className='rounded-lg border border-dashed bg-muted/20 px-5 py-8 text-center'>
      <p className='font-medium'>Translation not available</p>
      <p className='mx-auto mt-1 max-w-md text-sm text-muted-foreground'>
        This item does not have a {CONTENT_LANGUAGE_LABELS[language]} version.
        The default language is not shown as a substitute.
      </p>
    </div>
  );
}
