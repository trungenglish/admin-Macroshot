import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/ui/spinner';
import { useNutrientConfirmation } from '../hooks/use-nutrient-confirmation';
import { getNutrientActionPolicy } from '../nutrient-policy';
import type { Nutrient } from '../nutrient.types';

export interface SelectedNutrientDialogProps {
  nutrient: Nutrient | null;
  open: boolean;
  pending?: boolean;
  errorMessage?: string | null;
  onOpenChange(open: boolean): void;
  onConfirm?(nutrient: Nutrient): Promise<void>;
}

export function NutrientStatusDialog(props: SelectedNutrientDialogProps) {
  // Unmount local confirmation state when the selection or open state changes.
  if (!props.open || !props.nutrient) return null;
  return (
    <StatusConfirmation
      key={props.nutrient.id}
      {...props}
      nutrient={props.nutrient}
    />
  );
}

function StatusConfirmation({
  nutrient,
  open,
  pending = false,
  errorMessage,
  onOpenChange,
  onConfirm,
}: SelectedNutrientDialogProps & { nutrient: Nutrient }) {
  const { busy, requestError, isPending, confirm } = useNutrientConfirmation({
    nutrient,
    open,
    pending,
    onOpenChange,
    onConfirm,
  });
  const action =
    getNutrientActionPolicy(nutrient).statusAction === 'deactivate'
      ? 'Deactivate'
      : 'Reactivate';

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPending()) onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent
        aria-busy={busy}
        onEscapeKeyDown={(event) => {
          if (isPending()) event.preventDefault();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>
            {action} {nutrient.name}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {nutrient.isActive
              ? 'Existing ingredient data remains unchanged. While this nutrient is inactive, new associations cannot select it.'
              : 'This nutrient will be available for new ingredient associations again. Existing ingredient data remains unchanged.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {(errorMessage || requestError) && (
          <Alert variant='destructive'>
            <AlertDescription>{errorMessage || requestError}</AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy || !onConfirm}
            onClick={(event) => {
              event.preventDefault();
              void confirm();
            }}
          >
            {busy && (
              <Spinner
                aria-hidden='true'
                data-icon='inline-start'
              />
            )}
            {action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
