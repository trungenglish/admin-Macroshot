import { useCallback, useRef } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router-dom';

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

export function useIngredientDirtyGuard(isPending: boolean) {
  const dirty = useRef(false);
  const pending = useRef(false);
  const saved = useRef(false);
  const onDirtyChange = useCallback((value: boolean) => {
    dirty.current = value;
  }, []);
  const blocker = useBlocker(
    useCallback(() => !saved.current && (dirty.current || pending.current), []),
  );
  useBeforeUnload(
    useCallback((event: BeforeUnloadEvent) => {
      if (!saved.current && (dirty.current || pending.current)) {
        event.preventDefault();
        event.returnValue = '';
      }
    }, []),
  );
  const startPending = useCallback(() => {
    pending.current = true;
  }, []);
  const finishPending = useCallback(() => {
    pending.current = false;
  }, []);
  function markSaved() {
    // Synchronous bypass is necessary: own success navigation happens before
    // React has flushed pending/dirty updates, and must never ask to discard.
    saved.current = true;
    dirty.current = false;
    pending.current = false;
    if (blocker.state === 'blocked') blocker.reset();
  }
  const confirmation = (
    <AlertDialog
      open={blocker.state === 'blocked'}
      onOpenChange={(open) => {
        if (!open && blocker.state === 'blocked') blocker.reset();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isPending ? 'Saving ingredient' : 'Discard changes?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isPending
              ? 'Please wait for the save request to finish. Leaving does not cancel this request.'
              : 'Your unsaved changes will be lost if you leave this page.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              if (blocker.state === 'blocked') blocker.reset();
            }}
          >
            Stay
          </AlertDialogCancel>
          {!isPending && (
            <AlertDialogAction
              onClick={(event) => {
                if (pending.current) {
                  event.preventDefault();
                  return;
                }
                if (blocker.state === 'blocked') blocker.proceed();
              }}
            >
              Discard changes
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  return {
    onDirtyChange,
    startPending,
    finishPending,
    markSaved,
    confirmation,
  };
}
