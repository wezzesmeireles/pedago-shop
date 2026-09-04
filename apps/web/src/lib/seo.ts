export function categorySeoSlug(value: unknown) {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function categoryPath(value: unknown) {
  const slug = categorySeoSlug(value);
  return slug ? `/atividades/${encodeURIComponent(slug)}` : '/catalogo';
}
