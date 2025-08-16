/**
 * Validates if a string is a valid Google Docs URL
 * @param url The URL to validate
 * @returns boolean indicating if the URL is a valid Google Docs URL
 */
export const isValidGoogleDocsUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const isValidHost = [
      'docs.google.com',
      'drive.google.com',
    ].includes(urlObj.hostname);

    // Check for Google Docs document path
    const isDocsPath = urlObj.pathname.includes('/document/d/');
    
    // Check for Google Drive document path
    const isDrivePath = urlObj.hostname === 'drive.google.com' && 
      (urlObj.pathname.startsWith('/file/d/') || urlObj.searchParams.has('id'));

    return isValidHost && (isDocsPath || isDrivePath);
  } catch (e) {
    return false;
  }
};

/**
 * Validates if a string is a valid URL
 * @param url The URL to validate
 * @returns boolean indicating if the string is a valid URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Validates if a string is a valid image URL
 * @param url The URL to validate
 * @returns boolean indicating if the URL points to a valid image
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    // Basic URL validation
    new URL(url);
    
    // Check for common image file extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'];
    const urlLower = url.toLowerCase();
    
    // Check if URL ends with an image extension
    const hasImageExtension = imageExtensions.some(ext => 
      urlLower.endsWith(ext) || 
      urlLower.includes(`${ext}?`) ||
      urlLower.includes(`${ext}&`)
    );
    
    // Check if URL is from a known image hosting service
    const imageHosts = [
      'i.imgur.com',
      'imgur.com',
      'images.unsplash.com',
      'drive.google.com',
      'lh3.googleusercontent.com',
      'i.ibb.co',
      'corsproxy.io',
      'images.weserv.nl',
      'picsum.photos',
      'source.unsplash.com',
      'placekitten.com',
      'picsum.photos'
    ];
    
    const isFromImageHost = imageHosts.some(host => urlLower.includes(host));
    
    // If it's a data URL (base64 encoded image)
    const isDataUrl = urlLower.startsWith('data:image/');
    
    // Allow any URL that passes basic validation and either has an image extension, is from a known host, or is a data URL
    return hasImageExtension || isFromImageHost || isDataUrl;
  } catch (e) {
    return false;
  }
};
