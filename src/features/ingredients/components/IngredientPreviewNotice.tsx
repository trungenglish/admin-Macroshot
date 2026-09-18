import { Alert, AlertDescription } from '@/components/ui/alert';
import { isIngredientsPreview } from '../api/ingredient-transport';

export function IngredientPreviewNotice(): React.JSX.Element | null {
  return isIngredientsPreview ? (
    <Alert>
      <AlertDescription>
        Development preview — temporary data; no live API.
      </AlertDescription>
    </Alert>
  ) : null;
}
