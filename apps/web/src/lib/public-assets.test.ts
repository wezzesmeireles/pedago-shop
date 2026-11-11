import { describe, it, expect } from 'vitest';
import { resolveStorageAssets } from './public-assets';

describe('public storage assets after a domain migration', () => {
  it('rewrites cached banners and product covers to the current origin', () => {
    const data = { banners: [{ imageUrl: 'https://www.sitepedagogico.com/v1/storage/buckets/covers/files/banner/view?project=p' }],
      products: [{ coverImageUrl: 'https://appwrite.wsgestao.digital/v1/storage/buckets/covers/files/cover/view?project=p' }] };
    const result = resolveStorageAssets(data, 'https://shop.example.com');
    expect(result.banners[0].imageUrl).toBe('https://shop.example.com/v1/storage/buckets/covers/files/banner/view?project=p');
    expect(result.products[0].coverImageUrl).toContain('https://shop.example.com/v1/storage/');
    expect(data.banners[0].imageUrl).toContain('https://www.sitepedagogico.com/');
  });
  it('preserves external images, local files and non-storage links', () => {
    const urls = ['https://external.example.com/v1/storage/image.png', '/logo.png', 'https://www.sitepedagogico.com/auth/login', null];
    expect(resolveStorageAssets(urls, 'https://shop.example.com')).toEqual(urls);
  });
});
