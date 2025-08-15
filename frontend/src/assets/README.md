# Assets Folder

This folder contains static assets for your React application.

## Logo Image

- **Current file**: `logo.png` (placeholder)
- **Usage**: Replace this file with your actual logo image
- **Supported formats**: PNG, JPG, SVG, GIF
- **Recommended size**: 40x40 pixels (matches the w-10 h-10 classes in the code)

## How to use:

1. **Replace the placeholder**: Delete `logo.png` and add your own image with the same filename
2. **Or use a different filename**: Update the import in `App.tsx` to match your filename
3. **Import in components**: Use `import logoImage from './assets/your-image.png'`

## Example:

```tsx
import React from 'react';
import myLogo from './assets/my-logo.png';

function MyComponent() {
  return <img src={myLogo} alt="My Logo" />;
}
```

## Benefits of this approach:

- ✅ Build-time optimization
- ✅ Type safety
- ✅ Automatic hashing for cache busting
- ✅ Clean imports
- ✅ Better development experience
