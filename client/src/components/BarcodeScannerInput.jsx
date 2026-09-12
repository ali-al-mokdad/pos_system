import { useEffect, useRef } from 'react';

/**
 * USB HID ("keyboard wedge") barcode/QR scanner input.
 *
 * The scanner types the code then sends Enter. This input keeps focus so the
 * cashier never has to click it, and re-grabs focus whenever the user clicks
 * anywhere that is not another form field.
 */
export default function BarcodeScannerInput({
  onScan,
  autoFocus = true,
  placeholder = 'Scan barcode or QR code...',
  className = '',
  inputRef,
}) {
  const localRef = useRef(null);
  const ref = inputRef || localRef;

  useEffect(() => {
    if (!autoFocus) return undefined;
    const el = ref.current;
    if (el) el.focus();

    const refocus = (e) => {
      const target = e.target;
      const isField =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);
      const modalOpen = document.querySelector('[data-modal-open="true"]');
      if (!isField && !modalOpen && ref.current) ref.current.focus();
    };

    document.addEventListener('click', refocus);
    return () => document.removeEventListener('click', refocus);
  }, [autoFocus, ref]);

  const submit = (e) => {
    e.preventDefault();
    const value = ref.current.value.trim();
    if (!value) return;
    ref.current.value = '';
    onScan(value);
  };

  return (
    <form onSubmit={submit} className={className}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg">▮▯▮</span>
        <input
          ref={ref}
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          className="input py-4 pl-16 text-lg font-mono tracking-wider"
          placeholder={placeholder}
        />
      </div>
    </form>
  );
}
