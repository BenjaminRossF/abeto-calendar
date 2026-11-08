"use client";

import { useActionState } from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Archive, LoaderCircle } from "lucide-react";
import { deleteEventAction } from "@/app/dashboard/actions";
import type { ActionState } from "@/app/actions/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

const initialState: ActionState = { ok: false };

export function EventArchiveDialog({ eventId }: { eventId: string }) {
  const action = deleteEventAction.bind(null, eventId);
  const [state, formAction, pending] = useActionState(
    async (_previous: ActionState, formData: FormData) => action(formData),
    initialState,
  );

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}>
        <Archive aria-hidden="true" data-icon="inline-start" /> Quitar evento
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 bg-foreground/25 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
        <AlertDialog.Popup className="fixed left-1/2 top-1/2 flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-5 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-safe:transition motion-safe:duration-150">
          <div className="flex flex-col gap-2">
            <AlertDialog.Title className="text-lg font-semibold">¿Quitar este evento?</AlertDialog.Title>
            <AlertDialog.Description className="text-sm leading-6 text-muted-foreground">
              El enlace dejará de aceptar reservas y el evento ya no aparecerá en tu lista. Las reservas existentes se conservarán.
            </AlertDialog.Description>
          </div>
          {state.error ? <p aria-live="polite" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">{state.error}</p> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Close className={cn(buttonVariants({ variant: "outline" }))} disabled={pending}>
              Volver
            </AlertDialog.Close>
            <form action={formAction}>
              <button className={cn(buttonVariants({ variant: "destructive" }), "w-full")} disabled={pending} type="submit">
                {pending ? <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" data-icon="inline-start" /> : null}
                {pending ? "Quitando evento…" : "Quitar evento"}
              </button>
            </form>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
