import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  afterEach(cleanup);

  it('renders title and message', () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Delete Item"
        message="Are you sure?"
      />,
    );

    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        open={true}
        onClose={onClose}
        onConfirm={() => {}}
        title="Delete"
        message="Sure?"
      />,
    );

    await user.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        open={true}
        onClose={() => {}}
        onConfirm={onConfirm}
        title="Delete"
        message="Sure?"
      />,
    );

    await user.click(screen.getByText('Eliminar'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables buttons when loading prop is true', () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Delete"
        message="Sure?"
        loading={true}
      />,
    );

    expect(screen.getByText('Cancelar')).toBeDisabled();
    expect(screen.getByText('Eliminando...')).toBeDisabled();
  });
});
