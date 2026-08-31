"use client";

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="panel-glow w-full max-w-sm rounded-2xl p-5">
        <h2 id="confirm-title" className="text-lg font-semibold text-[var(--ink)]">
          {title}
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="min-h-11 rounded-lg px-4 text-sm font-medium" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn-add px-4 text-sm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
