import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastContext';

const Trigger = () => {
    const toast = useToast();
    return <button onClick={() => toast.success('Saved!')}>fire</button>;
};

describe('ToastContext', () => {
    it('shows a toast when fired and removes it when dismissed', async () => {
        render(
            <ToastProvider>
                <Trigger />
            </ToastProvider>,
        );

        fireEvent.click(screen.getByText('fire'));

        const toast = await screen.findByRole('alert');
        expect(toast).toHaveTextContent('Saved!');

        fireEvent.click(screen.getByLabelText('Dismiss'));
        await waitFor(() => expect(screen.queryByText('Saved!')).not.toBeInTheDocument());
    });

    it('throws when useToast is used outside a ToastProvider', () => {
        const Bad = () => {
            useToast();
            return null;
        };
        // Silence the expected React error log for this assertion.
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => render(<Bad />)).toThrow(/ToastProvider/);
        spy.mockRestore();
    });
});
