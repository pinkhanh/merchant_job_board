'use client';

type AlertDialogProps = {
  title: string;
  message: string;
  cancelLabel?: string;
  confirmLabel: string;
  onCancel?: () => void;
  onConfirm: () => void;
};

export function AlertDialog({ title, message, cancelLabel = 'Đóng', confirmLabel, onCancel, onConfirm }: AlertDialogProps) {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="worker-alert-dialog-title"
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-30"
    >
      <div className="bg-white rounded-worker-md shadow-worker-modal p-5 w-[400px]">
        <h2 id="worker-alert-dialog-title" className="font-bold mb-2">
          {title}
        </h2>
        <p className="text-sm text-worker-text-secondary mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="border border-worker-border rounded-md px-4 py-2 text-sm font-semibold">
              {cancelLabel}
            </button>
          )}
          <button type="button" onClick={onConfirm} className="bg-worker-primary text-white rounded-md px-4 py-2 text-sm font-semibold">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
