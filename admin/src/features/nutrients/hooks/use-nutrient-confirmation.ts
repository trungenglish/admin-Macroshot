import { useRef, useState } from 'react';

import type { Nutrient } from '../nutrient.types';

interface NutrientConfirmationOptions {
  nutrient: Nutrient;
  open: boolean;
  pending?: boolean;
  canConfirm?: boolean;
  onOpenChange(open: boolean): void;
  onConfirm?(nutrient: Nutrient): Promise<void>;
}

export function useNutrientConfirmation({
  nutrient,
  open,
  pending = false,
  canConfirm = true,
  onOpenChange,
  onConfirm,
}: NutrientConfirmationOptions) {
  const submitting = useRef(false);
  const [localPending, setLocalPending] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const busy = pending || localPending;

  function isPending() {
    return pending || submitting.current;
  }

  async function confirm() {
    if (!open || isPending() || !onConfirm || !canConfirm) return;
    submitting.current = true;
    setLocalPending(true);
    setRequestError(null);
    try {
      await onConfirm(nutrient);
      onOpenChange(false);
    } catch (error) {
      setRequestError(
        (error as { message?: string })?.message ??
          'Unable to complete the request. Please try again.',
      );
    } finally {
      submitting.current = false;
      setLocalPending(false);
    }
  }

  return { busy, requestError, isPending, confirm };
}
