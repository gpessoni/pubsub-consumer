/** Agrupa itens de um array em um Map, por uma chave derivada de cada item. */
export function groupBy<T, K>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
}

/** Indexa itens de um array em um Map por chave, assumindo no maximo um item por chave. */
export function indexBy<T, K>(items: T[], keyFn: (item: T) => K): Map<K, T> {
  const map = new Map<K, T>();
  for (const item of items) {
    map.set(keyFn(item), item);
  }
  return map;
}
