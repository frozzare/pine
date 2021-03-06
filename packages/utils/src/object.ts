export { default as merge } from 'deepmerge';

export const isObject = (val: any): boolean =>
  val != null && typeof val === 'object' && Array.isArray(val) === false;

export const omit = (key: string, obj: any) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [key]: omitted, ...rest } = obj;
  return rest;
};
