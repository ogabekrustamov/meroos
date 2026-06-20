import { useEffect, useRef } from 'react';

/**
 * Accessibility helper for modal dialogs.
 *
 * When `open` becomes true it moves focus into the dialog (its first focusable
 * control, else the dialog itself), listens for Escape to call `onClose`, and
 * restores focus to the previously focused element when the dialog closes.
 *
 * Attach the returned ref to the dialog element and give it role="dialog"
 * aria-modal="true". This is not a full focus trap (Tab can still leave the
 * dialog) — it covers focus-on-open, Escape, and focus-restore.
 */
export function useDialog<T extends HTMLElement = HTMLDivElement>(
    open: boolean,
    onClose: () => void,
) {
    const ref = useRef<T>(null);
    const restoreRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!open) return;

        restoreRef.current = document.activeElement as HTMLElement | null;

        const node = ref.current;
        if (node) {
            const focusable = node.querySelector<HTMLElement>(
                'button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
                'textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
            );
            (focusable ?? node).focus();
        }

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
            }
        };
        document.addEventListener('keydown', onKey);

        return () => {
            document.removeEventListener('keydown', onKey);
            restoreRef.current?.focus?.();
        };
    }, [open, onClose]);

    return ref;
}
