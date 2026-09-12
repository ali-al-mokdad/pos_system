import Modal from './Modal';

export default function ConfirmDialog({ open, title = 'Are you sure?', message, confirmLabel = 'Confirm', onConfirm, onCancel, danger = true }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      width="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
    </Modal>
  );
}
