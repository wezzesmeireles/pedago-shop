export function useImageOptimizer() {
  function optimizeImage(url: string | undefined, width?: number): string {
    if (!url) return '';
    
    // Only optimize Appwrite storage URLs
    if (!url.includes('/storage/buckets/')) {
      return url;
    }

    try {
      // Replace /view with /preview to enable image transformations
      let optimizedUrl = url.replace(/\/view\?/, '/preview?');
      
      // Append webp and quality parameters
      optimizedUrl += '&output=webp&quality=85';
      
      if (width) {
        optimizedUrl += '&width=' + width;
      }
      
      return optimizedUrl;
    } catch (e) {
      return url;
    }
  }

  return { optimizeImage };
}
