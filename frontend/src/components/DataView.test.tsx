import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataView } from './DataView';

describe('DataView', () => {
  afterEach(cleanup);
  it('should show loading state', () => {
    render(
      <DataView data={null} isLoading={true} error={null}>
        {() => <div>content</div>}
      </DataView>,
    );

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('should show custom loading component', () => {
    render(
      <DataView
        data={null}
        isLoading={true}
        error={null}
        loadingComponent={<div>Custom loading</div>}
      >
        {() => <div>content</div>}
      </DataView>,
    );

    expect(screen.getByText('Custom loading')).toBeInTheDocument();
  });

  it('should show error state', () => {
    render(
      <DataView data={null} isLoading={false} error="Something went wrong">
        {() => <div>content</div>}
      </DataView>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should show retry button when onRetry is provided', () => {
    render(
      <DataView
        data={null}
        isLoading={false}
        error="Error"
        onRetry={() => {}}
      >
        {() => <div>content</div>}
      </DataView>,
    );

    expect(screen.getByText('Reintentar')).toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();

    render(
      <DataView
        data={null}
        isLoading={false}
        error="Error"
        onRetry={onRetry}
      >
        {() => <div>content</div>}
      </DataView>,
    );

    await user.click(screen.getByText('Reintentar'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should render custom error component', () => {
    render(
      <DataView
        data={null}
        isLoading={false}
        error="Error"
        errorComponent={(msg) => <div>Custom: {msg}</div>}
      >
        {() => <div>content</div>}
      </DataView>,
    );

    expect(screen.getByText('Custom: Error')).toBeInTheDocument();
  });

  it('should show empty state when data is null', () => {
    render(
      <DataView data={null} isLoading={false} error={null}>
        {() => <div>content</div>}
      </DataView>,
    );

    expect(screen.getByText('No hay datos disponibles')).toBeInTheDocument();
  });

  it('should show empty state when data is empty array', () => {
    render(
      <DataView data={[]} isLoading={false} error={null}>
        {() => <div>content</div>}
      </DataView>,
    );

    expect(screen.getByText('No hay datos disponibles')).toBeInTheDocument();
  });

  it('should show custom empty component', () => {
    render(
      <DataView
        data={null}
        isLoading={false}
        error={null}
        emptyComponent={<div>Nothing here</div>}
      >
        {() => <div>content</div>}
      </DataView>,
    );

    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('should render children when data is available', () => {
    render(
      <DataView data="hello" isLoading={false} error={null}>
        {(data) => <div>{data}</div>}
      </DataView>,
    );

    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('should render children with array data', () => {
    render(
      <DataView data={[1, 2, 3]} isLoading={false} error={null}>
        {(data) => <div>{data.join(',')}</div>}
      </DataView>,
    );

    expect(screen.getByText('1,2,3')).toBeInTheDocument();
  });
});
