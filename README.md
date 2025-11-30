# SillyTavern Gallery Pro

A React-based gallery extension for SillyTavern with grid view, lightbox, sorting, and upload support.

## Screenshots

<img width="488" alt="Grid View" src="https://github.com/user-attachments/assets/853e1a24-5738-45a1-a240-7e2613800b4c" />
<img width="1635" alt="Lightbox View" src="https://github.com/user-attachments/assets/700348a4-b03d-41d0-a10a-c092f7d08ea8" />
<img width="1428" alt="Gallery Interface" src="https://github.com/user-attachments/assets/5acf6239-9449-4576-b894-5f9e19d1affd" />

## Features

- **Grid View**: Responsive thumbnail mosaic with filenames
- **Lightbox View**: Full-screen viewer with navigation controls
- **Video Support**: MP4, WebM, OGG, MOV, AVI, MKV playback
- **Sorting**: By name (A-Z, Z-A) or date (newest, oldest)
- **Upload**: Add images/videos directly from the gallery
- **Delete**: Remove files with confirmation
- **Keyboard Navigation**: Arrow keys + Escape
- **Lazy Loading**: Thumbnails load on demand

## Installation

1. Clone into `SillyTavern/public/scripts/extensions/third-party/`
2. Run:
   ```bash
   npm install
   npm run build
   ```
3. Restart SillyTavern

## API

```javascript
// Open gallery
window.SillyTavernGalleryPro.open(
    items,           // [{src: 'url'}]
    initialIndex,    // Starting index (default: 0)
    onDelete,        // Async delete callback (optional)
    onRefresh,       // Async refresh callback (optional)
    galleryFolder    // Upload folder name (optional)
);

// Close gallery
window.SillyTavernGalleryPro.close();

// Check if open
window.SillyTavernGalleryPro.isOpen();
```

### Example

```javascript
const images = [
    { src: '/user/images/char1/image1.png' },
    { src: '/user/images/char1/image2.jpg' },
];

// Basic
window.SillyTavernGalleryPro.open(images);

// With callbacks
window.SillyTavernGalleryPro.open(
    images,
    0,
    async (url) => { /* delete handler */ },
    async (sortOrder) => { /* refresh handler */ },
    'character_name'
);
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` / `→` | Navigate |
| `Escape` | Close lightbox / gallery |

## Building

```bash
npm install
npm run build
```

## License

AGPL-3.0
