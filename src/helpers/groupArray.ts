export function groupArray<T extends Record<string, any>>(array: T[], groupKey: keyof T): { [key: string]: T[] } {
  return array.reduce((acc, item) => {
    const key = item[groupKey] as string;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as { [key: string]: T[] });
}
