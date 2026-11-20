#!/bin/bash
# ============================================================================
# READ-ALONG TEACHING OVERVIEW: generate_pwa_assets.sh (RaggieSoft Backstage)
# ============================================================================
# PLAIN-ENGLISH PURPOSE (WHAT THIS SCRIPT BUILDS & WHY IT EXISTS):
#   RaggieSoft Backstage (`https://backstage.raggiesoft.com`) is built not only
#   as a website, but also as an installable **Progressive Web App (PWA)**—meaning
#   readers can install it onto an iPhone, iPad, Android phone, Mac, Windows PC,
#   or Linux desktop alongside **RaggieSoft Book Reader** (`books.raggiesoft.com`)
#   and **The Listening Room** (`music.raggiesoft.com`).
#
#   Different operating systems require very different icon shapes and startup
#   images so an installed web app looks indistinguishable from a native app:
#     1. Modern desktop browsers look for a crisp vector/scalable `icon.svg`,
#        while legacy bookmark/tab surfaces look for a multi-size `favicon.ico`.
#     2. Apple iOS & iPadOS Home Screens require a `180x180` **opaque** square
#        PNG (`apple-icon-180.png`) because iOS cuts its own rounded-squircle
#        corners in hardware (pre-rounded transparent corners turn solid black!).
#     3. W3C Web App Manifests (`/manifest.json`) need TWO distinct icon pairs
#        at `192x192` and `512x512`:
#          - `purpose: "any"` -> Pre-rounded squircle icons with transparent
#            corners for macOS/Windows/Linux docks and taskbars.
#          - `purpose: "maskable"` -> Full-bleed opaque icons with a 10% inner
#            safe-zone margin so Android launchers can punch circles, teardrops,
#            or squircles out of the icon without slicing off the artwork!
#     4. Apple iOS & iPadOS Standalone WebClips require pixel-exact startup
#        splash screens (`<link rel="apple-touch-startup-image" ...>`) matching
#        every device resolution in BOTH Portrait and Landscape AND in BOTH
#        Light Mode and Dark Mode (`23` devices * `2` orientations * `2` color
#        schemes = **92 splash JPEGs**). Without them, launching from the Home
#        Screen flashes a jarring blank white screen.
#
# WHERE SOURCE IMAGES COME FROM & WHERE OUTPUTS GO:
#   - Inputs:
#       - Master Backstage crest: `raggiesoft-assets/raggiesoft-backstage/images/logos/backstage-app-icon.png`
#       - Imprint footer crest:   `raggiesoft-assets/raggiesoft-books/images/logos/oceanview-archives.png`
#   - Output 1 — Shared CDN (`raggiesoft-assets/raggiesoft-backstage/images/pwa-icons/`):
#       Holds all icons plus all 92 Light/Dark iOS startup splash JPEGs served
#       from `https://assets.raggiesoft.com/raggiesoft-backstage/images/pwa-icons/`.
#   - Output 2 — Local Static Public Folder (`subdomains/backstage/public/`):
#       Holds `favicon.ico` and `public/icons/*`, which `scripts/build.mjs`
#       copies directly into `dist/` so `/manifest.json` and `/sw.js` serve
#       icons from the exact same origin (`https://backstage.raggiesoft.com`).
# ============================================================================

# Bash Strict Mode: abort immediately on any failed command (`-e`), undefined
# variable (`-u`), or broken pipeline stage (`-o pipefail`).
set -euo pipefail

# Step into the `subdomains/backstage/` root directory regardless of caller CWD.
cd "$(dirname "$0")/.." || exit 1

echo "Generating RaggieSoft Backstage PWA icons and 92 Light/Dark Co-Branded iOS splash screens..."

# Run an inline Python 3 + Pillow (`PIL`) imaging pipeline via a single-quoted
# heredoc (`<< 'EOF'`) so Bash leaves Python variables and string formatting untouched.
/opt/homebrew/bin/python3 - << 'EOF'
import os, io, base64
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# Resolve directory paths for both the `raggiesoft-assets` CDN repo and the local `public/` folder
backstage_root = os.getcwd()
cdn_pwa_dir = os.path.abspath(os.path.join(backstage_root, "../../../raggiesoft-assets/raggiesoft-backstage/images/pwa-icons"))
logos_dir = os.path.abspath(os.path.join(backstage_root, "../../../raggiesoft-assets/raggiesoft-backstage/images/logos"))
books_logos_dir = os.path.abspath(os.path.join(backstage_root, "../../../raggiesoft-assets/raggiesoft-books/images/logos"))
public_dir = os.path.join(backstage_root, "public")
public_icons_dir = os.path.join(public_dir, "icons")

os.makedirs(cdn_pwa_dir, exist_ok=True)
os.makedirs(public_icons_dir, exist_ok=True)

# Load master RGBA artwork so alpha transparency channels are preserved during compositing
app_icon = Image.open(os.path.join(logos_dir, "backstage-app-icon.png")).convert("RGBA")
imprint_crest = Image.open(os.path.join(books_logos_dir, "oceanview-archives.png")).convert("RGBA")

# ============================================================================
# WCAG 2.1 AA CONTRAST-VERIFIED LIGHT & DARK MODE COLOR PALETTES
# ============================================================================
# Notice why the accent text color changes between Dark Mode and Light Mode:
#   - Champagne Stage Gold (`#F5C451`) gleams with high contrast against Dark Mode
#     Midnight Sapphire (`#070B14`), but would look washed-out on Light Mode `#F4F6FB`.
#   - Therefore Light Mode switches to Warm Stage Amber (`#92400E`), achieving
#     >= 6.1:1 contrast on `#F4F6FB` (comfortably exceeding the 4.5:1 WCAG AA floor).
ICON_EDGE_BG = (10, 17, 36)           # Deep midnight sapphire matching master Backstage icon edge
DARK_BG = (7, 11, 20)                 # #070B14 (RaggieSoft Backstage Dark Mode canvas)
LIGHT_BG = (244, 246, 251)            # #F4F6FB (RaggieSoft Backstage Light Mode canvas)

DARK_TEXT_PRIMARY = (248, 250, 252)   # #F8FAFC
DARK_TEXT_ACCENT = (245, 196, 81)     # #F5C451 (Backstage Champagne Stage Gold)
DARK_TEXT_MUTED = (148, 163, 184)     # #94A3B8

LIGHT_TEXT_PRIMARY = (15, 23, 42)     # #0F172A
LIGHT_TEXT_ACCENT = (146, 64, 14)     # #92400E (Accessible Warm Stage Amber >= 6.1:1 on #F4F6FB)
LIGHT_TEXT_MUTED = (71, 85, 105)      # #475569

# Helper that probes an ordered list of `(font_file_path, face_index)` tuples on macOS
# and returns the first readable TrueType font at `size` pixels.
def load_font(candidates, size):
    for path, idx in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size=size, index=idx)
            except Exception:
                pass
    return ImageFont.load_default()

SERIF_BOLD_CANDIDATES = [
    ("/System/Library/Fonts/Supplemental/Georgia Bold.ttf", 0),
    ("/System/Library/Fonts/NewYork.ttf", 0),
    ("/System/Library/Fonts/Helvetica.ttc", 1),
]
SANS_BOLD_CANDIDATES = [
    ("/System/Library/Fonts/Helvetica.ttc", 1),
    ("/System/Library/Fonts/SFNS.ttf", 0),
]
SANS_REG_CANDIDATES = [
    ("/System/Library/Fonts/Helvetica.ttc", 0),
    ("/System/Library/Fonts/SFNS.ttf", 0),
]

# ============================================================================
# HELPER 1: 2X-SUPERSAMPLED ROUNDED SQUIRCLE GENERATOR (`purpose: "any"`)
# ============================================================================
# Teaching Note — Why Supersample at 2x (`ss = size * 2`)?
#   Pillow's `ImageDraw.rounded_rectangle()` draws 1-bit pixel edges without
#   sub-pixel smoothing, which can look slightly stair-stepped ("aliased") along
#   curved corners. By drawing the mask and border at DOUBLE the target resolution
#   (`ss = size * 2`) and then downscaling by 50% with `Resampling.LANCZOS`,
#   every curved edge gets silky 4-sample anti-aliasing!
def make_rounded_squircle(img_rgba, size, radius_ratio=0.225, border_rgba=None):
    """Creates a 2x-supersampled anti-aliased rounded squircle icon."""
    ss = size * 2
    resized = img_rgba.resize((ss, ss), Image.Resampling.LANCZOS)
    mask = Image.new("L", (ss, ss), 0)
    draw = ImageDraw.Draw(mask)
    r = int(round(ss * radius_ratio))
    draw.rounded_rectangle((0, 0, ss - 1, ss - 1), radius=r, fill=255)

    out = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    out.paste(resized, (0, 0), mask)

    if border_rgba is not None:
        bdraw = ImageDraw.Draw(out)
        bw = max(2, int(round(ss * 0.012)))
        bdraw.rounded_rectangle(
            (bw // 2, bw // 2, ss - 1 - bw // 2, ss - 1 - bw // 2),
            radius=r,
            outline=border_rgba,
            width=bw,
        )

    return out.resize((size, size), Image.Resampling.LANCZOS)

# ============================================================================
# HELPER 2: W3C MASKABLE ICON GENERATOR (`purpose: "maskable"`)
# ============================================================================
# Teaching Note — What Is a Maskable Icon Safe Zone?
#   Under the W3C Web App Manifest spec, Android and ChromeOS launchers apply
#   user-chosen OS masks (circles, pills, squircles, teardrops) that can crop up
#   to 10% inward from every edge, leaving the central 80% circle as the guaranteed
#   "safe zone". `make_maskable_icon()` fills the entire square canvas edge-to-edge
#   with `ICON_EDGE_BG` (`rgb(10, 17, 36)`) and insets the artwork by 10% on all
#   four sides (`inner = size * 0.80`) so no OS mask ever clips the crest.
def make_maskable_icon(img_rgba, size, safe_padding_ratio=0.10):
    """Creates a full-bleed maskable icon with safe-zone padding so OS masks never clip the crest."""
    canvas = Image.new("RGB", (size, size), ICON_EDGE_BG)
    inner = int(round(size * (1.0 - 2.0 * safe_padding_ratio)))
    resized = img_rgba.resize((inner, inner), Image.Resampling.LANCZOS)
    offset = (size - inner) // 2
    canvas.paste(resized, (offset, offset), resized)
    return canvas

# 1. Generate SVG Favicon (`icon.svg` wrapping an optimized Base64-encoded 128x128 squircle PNG)
fav_png = make_rounded_squircle(app_icon, 128, radius_ratio=0.22, border_rgba=(245, 196, 81, 150))
buf = io.BytesIO()
fav_png.save(buf, format="PNG", optimize=True)
b64_fav = base64.b64encode(buf.getvalue()).decode("ascii")

svg_favicon = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <title>RaggieSoft Backstage — Bonus Features &amp; Behind-the-Scenes Archive</title>
  <image width="128" height="128" href="data:image/png;base64,{b64_fav}" />
</svg>
"""
with open(os.path.join(cdn_pwa_dir, "icon.svg"), "w") as f:
    f.write(svg_favicon)

# 2. Generate Multi-Resolution `favicon.ico` packing 16x16, 32x32, and 48x48 frames into one `.ico` file
ico_base = make_rounded_squircle(app_icon, 256, radius_ratio=0.22, border_rgba=(245, 196, 81, 165))
ico_base.save(os.path.join(public_dir, "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
ico_base.save(os.path.join(cdn_pwa_dir, "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])

# 3. Generate iOS Home Screen Icon (`180x180` full-bleed opaque RGB; iOS applies its own squircle mask)
apple_180 = app_icon.resize((180, 180), Image.Resampling.LANCZOS).convert("RGB")
apple_180.save(os.path.join(cdn_pwa_dir, "apple-icon-180.png"), format="PNG", optimize=True)

# 4. Generate Standard (`purpose: "any"`) & Maskable (`purpose: "maskable"`) Manifest Icons (`192x192`, `512x512`)
icon_192_any = make_rounded_squircle(app_icon, 192, radius_ratio=0.22, border_rgba=(245, 196, 81, 130))
icon_512_any = make_rounded_squircle(app_icon, 512, radius_ratio=0.22, border_rgba=(245, 196, 81, 130))
icon_192_any.save(os.path.join(cdn_pwa_dir, "icon-192.png"), format="PNG", optimize=True)
icon_512_any.save(os.path.join(cdn_pwa_dir, "icon-512.png"), format="PNG", optimize=True)

icon_192_mask = make_maskable_icon(app_icon, 192, safe_padding_ratio=0.10)
icon_512_mask = make_maskable_icon(app_icon, 512, safe_padding_ratio=0.10)
icon_192_mask.save(os.path.join(cdn_pwa_dir, "manifest-icon-192.maskable.png"), format="PNG", optimize=True)
icon_512_mask.save(os.path.join(cdn_pwa_dir, "manifest-icon-512.maskable.png"), format="PNG", optimize=True)

# ============================================================================
# 5. GENERATE ALL 46 iOS / iPadOS STARTUP SPLASH RESOLUTIONS (LIGHT + DARK = 92 FILES)
# ============================================================================
# Each row pairs `(portrait_width, portrait_height)` with `(landscape_width, landscape_height)`
# in physical device pixels (`CSS viewport * devicePixelRatio`), matching the exact 23 Apple
# device specs emitted by `IOS_SPLASH_SPECS` inside `scripts/build.mjs` (`renderIosSplashLinksHtml()`).
splash_resolutions = [
    (2048, 2732), (2732, 2048),
    (2064, 2752), (2752, 2064),
    (1668, 2420), (2420, 1668),
    (1668, 2388), (2388, 1668),
    (1668, 2224), (2224, 1668),
    (1536, 2048), (2048, 1536),
    (1640, 2360), (2360, 1640),
    (1620, 2160), (2160, 1620),
    (1488, 2266), (2266, 1488),
    (1320, 2868), (2868, 1320),
    (1206, 2622), (2622, 1206),
    (1260, 2736), (2736, 1260),
    (1290, 2796), (2796, 1290),
    (1179, 2556), (2556, 1179),
    (1170, 2532), (2532, 1170),
    (1284, 2778), (2778, 1284),
    (1080, 2340), (2340, 1080),
    (1242, 2688), (2688, 1242),
    (1125, 2436), (2436, 1125),
    (828, 1792),  (1792, 828),
    (1242, 2208), (2208, 1242),
    (750, 1334),  (1334, 750),
    (640, 1136),  (1136, 640),
]

# Renders a single resolution-adaptive co-branded splash screen (`w` x `h`) in either
# Light Mode (`is_dark=False`) or Dark Mode (`is_dark=True`):
#   - Scales icon size, blur radius, font sizes, and vertical rhythm proportionally
#     to `short_side = min(w, h)` so a 640x1136 iPhone SE and a 2732x2048 13" iPad Pro
#     both look balanced in portrait and landscape.
def make_cobranded_splash(w, h, is_dark):
    bg_rgb = DARK_BG if is_dark else LIGHT_BG
    text_primary = DARK_TEXT_PRIMARY if is_dark else LIGHT_TEXT_PRIMARY
    text_accent = DARK_TEXT_ACCENT if is_dark else LIGHT_TEXT_ACCENT
    text_muted = DARK_TEXT_MUTED if is_dark else LIGHT_TEXT_MUTED
    border_rgba = (245, 196, 81, 155) if is_dark else (146, 64, 14, 95)

    canvas = Image.new("RGBA", (w, h), bg_rgb + (255,))
    short_side = min(w, h)
    is_landscape = w > h

    # Render central Backstage squircle crest + soft Gaussian-blurred elevation shadow
    icon_dim = int(round(short_side * (0.24 if is_landscape else 0.28)))
    squircle = make_rounded_squircle(app_icon, icon_dim, radius_ratio=0.225, border_rgba=border_rgba)

    shadow_pad = int(round(icon_dim * 0.18))
    shadow = Image.new("RGBA", (icon_dim + shadow_pad * 2, icon_dim + shadow_pad * 2), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sr = int(round(icon_dim * 0.225))
    shadow_alpha = 140 if is_dark else 65
    sdraw.rounded_rectangle(
        (shadow_pad, shadow_pad, shadow_pad + icon_dim - 1, shadow_pad + icon_dim - 1),
        radius=sr,
        fill=(0, 0, 0, shadow_alpha),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=max(6, int(round(icon_dim * 0.045)))))

    center_x = w // 2
    icon_y = int(round(h * (0.22 if is_landscape else 0.27))) - (icon_dim // 2)
    shadow_offset_y = max(4, int(round(icon_dim * 0.03)))

    # `alpha_composite` blends translucent shadow pixels cleanly onto `canvas` before placing the crisp icon
    canvas.alpha_composite(shadow, (center_x - icon_dim // 2 - shadow_pad, icon_y - shadow_pad + shadow_offset_y))
    canvas.alpha_composite(squircle, (center_x - icon_dim // 2, icon_y))

    draw = ImageDraw.Draw(canvas)

    # Compute responsive point sizes anchored to `short_side` with readable minimum floors
    title_sz = max(24, int(round(short_side * (0.044 if is_landscape else 0.050))))
    sub_sz = max(13, int(round(short_side * (0.019 if is_landscape else 0.021))))
    imp_title_sz = max(14, int(round(short_side * (0.020 if is_landscape else 0.022))))
    imp_sub_sz = max(11, int(round(short_side * (0.015 if is_landscape else 0.0165))))

    font_title = load_font(SERIF_BOLD_CANDIDATES, title_sz)
    font_sub = load_font(SANS_BOLD_CANDIDATES, sub_sz)
    font_imp_title = load_font(SANS_BOLD_CANDIDATES, imp_title_sz)
    font_imp_sub = load_font(SANS_REG_CANDIDATES, imp_sub_sz)

    title_text = "RaggieSoft Backstage"
    sub_text = "BONUS FEATURES & STORY COMPANION ARCHIVE"

    # Measure exact rendered pixel bounding boxes (`textbbox`) to horizontally center each line (`center_x - tw // 2`)
    title_y = icon_y + icon_dim + int(round(short_side * 0.042))
    tb = draw.textbbox((0, 0), title_text, font=font_title)
    tw = tb[2] - tb[0]
    draw.text((center_x - tw // 2, title_y), title_text, font=font_title, fill=text_primary)

    sub_y = title_y + (tb[3] - tb[1]) + int(round(short_side * 0.018))
    sb = draw.textbbox((0, 0), sub_text, font=font_sub)
    sw = sb[2] - sb[0]
    draw.text((center_x - sw // 2, sub_y), sub_text, font=font_sub, fill=text_accent)

    # Anchor the co-branded RaggieSoft Media / Ocean View Archives & Engine Room Records
    # footer crest near the bottom edge (`h - bottom_margin`)
    crest_dim = max(36, int(round(short_side * (0.068 if is_landscape else 0.078))))
    crest_resized = imprint_crest.resize((crest_dim, crest_dim), Image.Resampling.LANCZOS)

    imp_line1 = "RAGGIESOFT MEDIA"
    imp_line2 = "Ocean View Archives & Engine Room Records"
    ib1 = draw.textbbox((0, 0), imp_line1, font=font_imp_title)
    ib2 = draw.textbbox((0, 0), imp_line2, font=font_imp_sub)
    iw1, ih1 = ib1[2] - ib1[0], ib1[3] - ib1[1]
    iw2, ih2 = ib2[2] - ib2[0], ib2[3] - ib2[1]

    bottom_margin = int(round(h * (0.085 if is_landscape else 0.075)))
    imp_sub_y = h - bottom_margin - ih2
    imp_title_y = imp_sub_y - int(round(short_side * 0.008)) - ih1
    crest_y = imp_title_y - int(round(short_side * 0.018)) - crest_dim

    canvas.alpha_composite(crest_resized, (center_x - crest_dim // 2, crest_y))
    draw.text((center_x - iw1 // 2, imp_title_y), imp_line1, font=font_imp_title, fill=text_accent)
    draw.text((center_x - iw2 // 2, imp_sub_y), imp_line2, font=font_imp_sub, fill=text_muted)

    # Convert RGBA -> opaque RGB so Pillow can write compact optimized JPEGs
    return canvas.convert("RGB")

# Loop through all 46 `(w, h)` resolutions and emit both Light (`apple-splash-W-H.jpg`)
# and Dark (`apple-splash-dark-W-H.jpg`) startup JPEGs (92 files total).
for (w, h) in splash_resolutions:
    light_img = make_cobranded_splash(w, h, is_dark=False)
    light_img.save(os.path.join(cdn_pwa_dir, f"apple-splash-{w}-{h}.jpg"), format="JPEG", quality=92, optimize=True)

    dark_img = make_cobranded_splash(w, h, is_dark=True)
    dark_img.save(os.path.join(cdn_pwa_dir, f"apple-splash-dark-{w}-{h}.jpg"), format="JPEG", quality=92, optimize=True)

print(f"Generated {len(splash_resolutions)} Light and {len(splash_resolutions)} Dark Backstage splash screens in {cdn_pwa_dir}")
EOF

# Mirror the core app icons from `raggiesoft-assets` into `subdomains/backstage/public/icons/`
# so `scripts/build.mjs` (`copyDirectoryRecursive(publicDir, distDir)`) ships them directly
# inside `dist/icons/` for same-origin `/manifest.json` and `/sw.js` pre-caching.
cp "../../../raggiesoft-assets/raggiesoft-backstage/images/pwa-icons/icon-192.png" \
   "../../../raggiesoft-assets/raggiesoft-backstage/images/pwa-icons/icon-512.png" \
   "../../../raggiesoft-assets/raggiesoft-backstage/images/pwa-icons/manifest-icon-192.maskable.png" \
   "../../../raggiesoft-assets/raggiesoft-backstage/images/pwa-icons/manifest-icon-512.maskable.png" \
   "../../../raggiesoft-assets/raggiesoft-backstage/images/pwa-icons/apple-icon-180.png" \
   "../../../raggiesoft-assets/raggiesoft-backstage/images/pwa-icons/icon.svg" \
   public/icons/

# Sanity-check every copied PNG in `public/icons/` via macOS `sips` to ensure all files
# decode cleanly with valid image headers (`set -e` aborts if any PNG is corrupt or missing).
/usr/bin/sips -g pixelWidth -g pixelHeight \
  public/icons/apple-icon-180.png \
  public/icons/icon-192.png \
  public/icons/icon-512.png \
  public/icons/manifest-icon-192.maskable.png \
  public/icons/manifest-icon-512.maskable.png >/dev/null

echo "RaggieSoft Backstage PWA assets generated and sips-verified successfully!"
