import { useEffect, useState } from 'react';

export type Store = {
  id: string;
  name: string;
  streetAddress: string;
  ward: string;
  district: string;
  city: string;
};

export function useStoreSearch() {
  const [keyword, setKeyword] = useState('');
  const [city, setCityState] = useState('');
  const [district, setDistrict] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Store[]>([]);
  const [total, setTotal] = useState(0);

  function setCity(next: string) {
    setCityState(next);
    setDistrict('');
  }

  function fetchPage(targetPage: number, replace: boolean) {
    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    if (city) params.set('city', city);
    if (district) params.set('district', district);
    params.set('page', String(targetPage));

    fetch(`/api/merchant/stores?${params.toString()}`)
      .then((res) => res.json())
      .then((body) => {
        setItems((prev) => (replace ? body.items : [...prev, ...body.items]));
        setTotal(body.total);
      });
  }

  useEffect(() => {
    setPage(1);
    setItems([]);
    fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, city, district]);

  function loadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(nextPage, false);
  }

  return {
    keyword,
    setKeyword,
    city,
    setCity,
    district,
    setDistrict,
    items,
    total,
    hasMore: items.length < total,
    loadMore,
  };
}
