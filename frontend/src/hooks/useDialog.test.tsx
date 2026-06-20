import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useDialog } from './useDialog';

function Dialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const ref = useDialog(open, onClose);
    if (!open) return null;
    return (
        <div role="dialog" tabIndex={-1} ref={ref}>
            <button>First</button>
            <button>Second</button>
        </div>
    );
}

describe('useDialog', () => {
    it('moves focus to the first focusable control on open', () => {
        render(<Dialog open onClose={() => {}} />);
        expect(screen.getByText('First')).toHaveFocus();
    });

    it('calls onClose when Escape is pressed', () => {
        const onClose = vi.fn();
        render(<Dialog open onClose={onClose} />);
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
