const fs = require('fs');
let code = fs.readFileSync('apps/web/src/services/interfaces.ts', 'utf8');

// 1. Add DecartTryOnAdapter export
if (!code.includes('DecartTryOnAdapter')) {
  code += `

export class DecartTryOnAdapter implements TryOnEngine {
  public async synthesize(userPhoto: string, garments: Product[]): Promise<string> {
    if (!userPhoto || !garments.length) return userPhoto;
    try {
      const { executeDecartTryOn } = await import('./decart-client');
      const primaryGarment = garments[0];
      const prompt = \`Wearing \${garments.map(g => g.name).join(' and ')}, photorealistic virtual try-on, accurate fabric drape\`;
      const res = await executeDecartTryOn({
        userImageUrl: userPhoto,
        garmentImageUrl: primaryGarment.image,
        prompt,
        category: primaryGarment.categorySlug,
      });
      if (res && res.resultImageUrl && res.resultImageUrl !== userPhoto) {
        return res.resultImageUrl;
      }
    } catch (err) {
      console.warn('DecartTryOnAdapter fallback to canvas:', err);
    }
    const fallback = new WearsonTryOnAdapter();
    return fallback.synthesize(userPhoto, garments);
  }
}
`;
}

// 2. Fix loadImage error handler to retry without CORS
code = code.replace(
  'img.onerror = (err) => reject(err);',
  'img.onerror = () => { const f = new Image(); f.onload = () => resolve(f); f.onerror = () => resolve(img); f.src = src; };'
);

fs.writeFileSync('apps/web/src/services/interfaces.ts', code, 'utf8');
console.log('Successfully updated apps/web/src/services/interfaces.ts');

