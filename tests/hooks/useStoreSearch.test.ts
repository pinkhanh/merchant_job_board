import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStoreSearch } from '@/lib/hooks/useStoreSearch';

function mockFetchOnce(body: any) {
  (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => body });
}

describe('useStoreSearch', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches page 1 with no filters on mount', async () => {
    mockFetchOnce({ items: [{ id: 's1', name: 'Trụ Sở Chính' }], total: 15 });

    const { result } = renderHook(() => useStoreSearch());

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(global.fetch).toHaveBeenCalledWith('/api/merchant/stores?page=1');
    expect(result.current.total).toBe(15);
    expect(result.current.hasMore).toBe(true);
  });

  it('appends the next page on loadMore without dropping existing items', async () => {
    mockFetchOnce({ items: [{ id: 's1', name: 'Store 1' }], total: 2 });
    const { result } = renderHook(() => useStoreSearch());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    mockFetchOnce({ items: [{ id: 's2', name: 'Store 2' }], total: 2 });
    act(() => result.current.loadMore());

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(global.fetch).toHaveBeenLastCalledWith('/api/merchant/stores?page=2');
    expect(result.current.hasMore).toBe(false);
  });

  it('resets to page 1 and replaces items when the keyword changes', async () => {
    mockFetchOnce({ items: [{ id: 's1', name: 'Store 1' }], total: 1 });
    const { result } = renderHook(() => useStoreSearch());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    mockFetchOnce({ items: [{ id: 's2', name: 'Matched Store' }], total: 1 });
    act(() => result.current.setKeyword('Matched'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenLastCalledWith('/api/merchant/stores?keyword=Matched&page=1');
      expect(result.current.items).toEqual([{ id: 's2', name: 'Matched Store' }]);
    });
  });

  it('clears the district when the city changes', async () => {
    mockFetchOnce({ items: [], total: 0 });
    const { result } = renderHook(() => useStoreSearch());
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    mockFetchOnce({ items: [], total: 0 });
    act(() => result.current.setDistrict('Cầu Giấy'));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    mockFetchOnce({ items: [], total: 0 });
    act(() => result.current.setCity('Hà Nội'));

    await waitFor(() => {
      expect(result.current.district).toBe('');
    });
  });
});
