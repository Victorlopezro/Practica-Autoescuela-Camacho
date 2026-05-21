import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { FormField } from './FormField';

describe('FormField', () => {
  afterEach(cleanup);

  it('renders label', () => {
    render(
      <FormField label="Full Name">
        <input type="text" />
      </FormField>,
    );

    expect(screen.getByText('Full Name')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <FormField label="Email">
        <input type="email" data-testid="email-input" />
      </FormField>,
    );

    expect(screen.getByTestId('email-input')).toBeInTheDocument();
  });

  it('shows error message when error prop is provided', () => {
    render(
      <FormField label="Username" error="Username is required">
        <input type="text" />
      </FormField>,
    );

    expect(screen.getByText('Username is required')).toBeInTheDocument();
  });

  it('shows required indicator when required prop is true', () => {
    render(
      <FormField label="Name" required>
        <input type="text" />
      </FormField>,
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not show error when no error prop', () => {
    render(
      <FormField label="Age">
        <input type="number" />
      </FormField>,
    );

    expect(screen.queryByText('Age')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
