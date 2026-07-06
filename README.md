# Mehr Avaye Balout - Music Academy Website

## Image Asset Management

### Founder Portrait Images

The About section uses two portrait images that automatically switch based on the active theme (light/dark).

**Image locations:**

| Purpose | Path | Dimensions | Format | Size |
|---------|------|-----------|--------|------|
| Light Theme Portrait | `public/images/founder/mostafa-mogouei-founder-mehr-avaye-balout-light.jpg` | 512×512 | JPEG | ~49KB |
| Dark Theme Portrait | `public/images/founder/mostafa-mogouei-founder-mehr-avaye-balout-dark.jpg` | 512×512 | JPEG | ~35KB |

**SEO-optimized filenames include:**
- Founder's name: `mostafa-mogouei`
- Role keywords: `founder`
- Institution name: `mehr-avaye-balout`
- Theme indicator: `light` / `dark`

**Alt tags (auto-applied by component):**
- FA: `مصطفی موگویی - بنیان‌گذار و مدیر مؤسسه موسیقی مهر آوای بلوط - بیش از ۲۰ سال تجربه آموزش موسیقی`
- EN: `Mostafa Mogouei - Founder & Director of Mehr Avaye Balout Music Institute - Over 20 years of music education experience`

### How to Replace Portrait Images

1. Prepare your images at **512×512 pixels** (square crop)
2. Export as **JPEG, quality 80-85%** (optimal for web)
3. Keep file size under **100KB** per image
4. Place the light-themed portrait at the light path above
5. Place the dark-themed portrait at the dark path above
6. The Next.js `Image` component handles lazy loading, responsive sizes, and optimization automatically

### Image Performance Notes

- Images are loaded with `loading="lazy"` (not eager) since they appear below the fold
- `sizes` attribute is set for responsive loading: 192px mobile, 224px tablet, 256px desktop
- Quality is set to 85 (good balance of visual quality and file size)
- A graceful fallback (gradient placeholder with music icon) appears if the image fails to load
- Theme switching is handled by `next-themes` with `resolvedTheme`

### Other Image Directories

```
public/images/
  founder/          # Founder portrait images (currently in use)
  workshops/        # Workshop cover images (create if needed)
  courses/          # Course images (create if needed)
  blog/             # Blog post cover images (create if needed)
```

When adding new images:
- Always use SEO-friendly filenames with hyphens (e.g., `violin-workshop-improvisation-2024.jpg`)
- Compress to JPEG quality 80-85 or WebP
- Keep dimensions appropriate for the display size
- Never use PNG for photos (too large for web)
- Use `next/image` `<Image>` component for automatic optimization
