// Util para normalizar URLs de imagens em dev e produção
const BASE_DOMAIN = 'https://www.fundodobaufilmes.com';

export function getImageSrc(src?: string | null): string {
  if (!src) return '';
  // já é data URL
  if (src.startsWith('data:')) return src;
  // já é absoluta
  if (/^https?:\/\//i.test(src)) return src;
  // caminho começando por '/'
  if (src.startsWith('/')) return `${BASE_DOMAIN}${src}`;
  // nome de arquivo simples
  return `${BASE_DOMAIN}/images/filmes/${src}`;
}
