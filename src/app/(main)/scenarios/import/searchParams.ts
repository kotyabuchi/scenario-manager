import { createSearchParamsCache, parseAsString } from 'nuqs/server';

export const importSearchParamsParsers = {
  url: parseAsString,
};

export const importSearchParamsCache = createSearchParamsCache(
  importSearchParamsParsers,
);
