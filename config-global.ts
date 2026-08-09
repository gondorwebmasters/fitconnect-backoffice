// Minimal stand-in for Minimals' CONFIG object — only the field the ported
// components/* actually read (static asset base path). This project has no
// assets/ mirror of Minimals' bundled illustrations/icons; those specific
// decorative images (blur backgrounds, flag icons, file-type icons) will
// 404 silently unless those assets are copied into public/.
export const CONFIG = {
  site: {
    basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
    serverUrl: process.env.NEXT_PUBLIC_SERVER_URL ?? '',
    assetURL: process.env.NEXT_PUBLIC_ASSET_URL ?? '',
  },
};
