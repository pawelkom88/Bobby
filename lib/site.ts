export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || 'https://readywithbobby.online';

export function getAbsoluteUrl(pathname: string) {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return new URL(normalizedPath, BASE_URL).toString();
}
