import { useEffect, useState } from 'react';

/**
 * 値の変更をdebounceして返すフック
 * 入力値が変更されてから指定ミリ秒後に更新値を返す
 */
export const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};
