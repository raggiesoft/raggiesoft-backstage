#!/bin/bash
# ============================================================================
# READ-ALONG TEACHING OVERVIEW: generate_og_images.sh (RaggieSoft Backstage)
# ============================================================================
# PLAIN-ENGLISH PURPOSE (WHAT THIS SCRIPT BUILDS & WHY IT EXISTS):
#   Whenever someone shares a link to RaggieSoft Backstage
#   (`https://backstage.raggiesoft.com/...`) in iMessage, Discord, Slack,
#   Bluesky, Mastodon, X/Twitter, LinkedIn, or Facebook, that messaging app
#   reads `<meta property="og:image" ...>` (OpenGraph) and
#   `<meta name="twitter:image" ...>` in the HTML `<head>` to display a rich
#   visual preview card ("link unfurl").
#
#   The universal industry standard for large social preview cards
#   (`summary_large_image`) is an exact **1200 x 630 pixel** JPEG (an aspect
#   ratio of ~1.91:1). If a website instead points `og:image` at a massive
#   multi-megabyte raw PNG or an image with the wrong aspect ratio, chat apps
#   either refuse to load the preview, awkwardly crop characters' heads off,
#   or time out on mobile cellular connections.
#
# WHERE SOURCE IMAGES COME FROM & WHAT THIS SCRIPT PRODUCES:
#   - Inputs:
#       1. Backstage brand crest (`raggiesoft-assets/raggiesoft-backstage/images/logos/backstage-app-icon.png`)
#       2. Backstage scene artwork (`raggiesoft-assets/raggiesoft-backstage/images/scenes/*.jpg`)
#       3. Shared novel scene illustrations (`raggiesoft-assets/raggiesoft-books/images/scenes/**`)
#   - Outputs (`raggiesoft-assets/raggiesoft-backstage/images/og/*.jpg`):
#       1. `backstage-hub-og.jpg`: A custom-composited co-branded flagship card
#          rendered with Python Pillow (`PIL`) featuring the Backstage squircle
#          crest and typography on the left + a 2x2 showcase mosaic on the right.
#       2. 17 collection & dossier OpenGraph cards resized, center-cropped, and
#          compressed into fast-loading 1200x630 JPEGs via macOS `/usr/bin/sips`.
#   - Downstream Consumer:
#       `scripts/build.mjs` (`resolveOgImageForSlug()`) maps each compiled
#       Markdown dossier from `/raggiesoft-narratives/backstage/` to its exact
#       1200x630 JPEG URL in both static HTML `<head>` tags and `/api/v1/*.json`.
#
# THREE-STAGE PIPELINE:
#   Stage 1 — Python + Pillow (`PIL`) draws the composite Hub hero PNG canvas.
#   Stage 2 — `make_og_with_sips()` runs macOS `sips` (Scriptable Image
#             Processing System) to encode JPEG (quality 88), scale width to
#             1200px, guard minimum height >= 630px, and center-crop 630x1200.
#   Stage 3 — Automated dimension audit (`sips -g pixelWidth -g pixelHeight`)
#             halts immediately with exit code 1 if any card is not 1200x630.
# ============================================================================

# Enable Bash "Strict Mode" so silent failures can never produce broken assets:
#   -e : Exit immediately if any command returns a non-zero (error) exit code.
#   -u : Treat reading an undefined variable (`$TYPO`) as a fatal error.
#   -o pipefail : If a piped command (`cmd1 | cmd2`) fails on the left side,
#                 propagate that failure instead of masking it behind `cmd2`.
set -euo pipefail

# Always anchor the working directory to the `subdomains/backstage/` project root
# (`dirname "$0"` is `subdomains/backstage/scripts`, so `/..` steps up one level),
# regardless of which folder the developer invoked this script from.
cd "$(dirname "$0")/.." || exit 1

# Resolve absolute paths to the shared `raggiesoft-assets` repository (served in
# production at `https://assets.raggiesoft.com/`). Resolving `pwd` inside a
# subshell `$(...)` gives clean, canonical absolute paths without `../` segments.
ASSETS_ROOT="$(cd ../../../raggiesoft-assets && pwd)"
OG_DIR="${ASSETS_ROOT}/raggiesoft-backstage/images/og"
SCENES_DIR="${ASSETS_ROOT}/raggiesoft-backstage/images/scenes"
LOGOS_DIR="${ASSETS_ROOT}/raggiesoft-backstage/images/logos"
BOOKS_SCENES="${ASSETS_ROOT}/raggiesoft-books/images/scenes"

# Create the output OpenGraph folder if it does not exist yet (`-p` is idempotent:
# it creates missing parent folders and succeeds quietly if the folder already exists).
mkdir -p "${OG_DIR}"

echo "Building flagship RaggieSoft Backstage Hub composite card..."

# ============================================================================
# STAGE 1: COMPOSITE HUB CARD GENERATION VIA PYTHON PILLOW (`PIL`)
# ============================================================================
# How `python3 - arg1 arg2 arg3 << 'EOF'` works:
#   - The single dash `-` tells Python to read its script source code from
#     standard input (`stdin`, supplied by the `<< 'EOF'` heredoc) while still
#     passing the three paths after `-` into Python's `sys.argv[1..3]`.
#   - Quoting `'EOF'` in single quotes prevents Bash from expanding `$` or
#     backticks inside the Python code—everything between `<< 'EOF'` and `EOF`
#     is handed verbatim to the Python interpreter.
/opt/homebrew/bin/python3 - "${OG_DIR}/backstage-hub-og-raw.png" "${LOGOS_DIR}/backstage-app-icon.png" "${SCENES_DIR}" << 'EOF'
import sys, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# Unpack the three CLI arguments passed in from Bash after `python3 -`
out_path, icon_path, scenes_dir = sys.argv[1], sys.argv[2], sys.argv[3]

# Create a blank 1200x630 RGBA canvas filled with RaggieSoft Backstage's
# signature Midnight Sapphire Dark Mode background (`rgb(7, 11, 20)` = `#070B14`, alpha 255 = opaque).
W, H = 1200, 630
canvas = Image.new("RGBA", (W, H), (7, 11, 20, 255))

# Define the 4 illustrated story worlds featured in the right-hand 2x2 mosaic grid:
#   [0] Top-Left:     Bear & Bug Sanctuary (The Rachel Narrative)
#   [1] Top-Right:    Katie & Nate in the U.S. Senate Corridor (Katie & Nathaniel)
#   [2] Bottom-Left:  CPI Preston Hall & Commonwealth Green (Blacksburg Campus Lore)
#   [3] Bottom-Right: May 1999 Wingman Briefing — Ashley Raybourn & Bonnie Reed
tiles = [
    os.path.join(scenes_dir, "rachel-bug-and-bear-sanctuary.jpg"),
    os.path.join(scenes_dir, "katie-nate-us-senate-corridor.jpg"),
    os.path.join(scenes_dir, "cpi-preston-hall-commonwealth-green.jpg"),
    os.path.join(scenes_dir, "rachel-wingman-briefing-ashley-bonnie-1999.jpg"),
]

# Layout geometry (in pixels) for the right-hand 2x2 grid:
#   Starts at x = 560px so the left ~520px remains clear for the brand lockup.
#   2 columns * 304px + 12px gap = 620px wide (x = 560..1180, leaving a 20px right margin).
#   2 rows * 291px + 12px gap = 594px tall (y = 18..612, vertically centered in 630px).
mosaic_x = 560
tile_w, tile_h = 304, 291
gap = 12
start_y = 18

for idx, tpath in enumerate(tiles):
    # Convert linear index `0..3` into 2D grid coordinates:
    #   idx=0 -> col=0, row=0 | idx=1 -> col=1, row=0
    #   idx=2 -> col=0, row=1 | idx=3 -> col=1, row=1
    col = idx % 2
    row = idx // 2
    im = Image.open(tpath).convert("RGB")

    # Aspect-ratio-aware smart crop ("object-fit: cover" in Python):
    # Instead of squashing or stretching a 16:9 scene into a ~1.04:1 near-square tile,
    # we crop the source image to match `target_ratio` BEFORE resizing:
    target_ratio = tile_w / tile_h
    iw, ih = im.size
    if (iw / ih) > target_ratio:
        # Source image is wider than the tile: slice equal margins off left and right.
        nw = int(round(ih * target_ratio))
        left = (iw - nw) // 2
        im = im.crop((left, 0, left + nw, ih))
    else:
        # Source image is taller than the tile: bias the crop toward the upper third
        # (`(ih - nh) // 3`) so character faces and architectural rooflines stay framed.
        nh = int(round(iw / target_ratio))
        top = max(0, (ih - nh) // 3)
        im = im.crop((0, top, iw, top + nh))

    # Downscale smoothly using a high-quality Lanczos sinc filter (prevents blocky pixelation).
    im = im.resize((tile_w, tile_h), Image.Resampling.LANCZOS)

    # Build an 8-bit grayscale (`"L"`) alpha mask (`0` = transparent corners, `255` = opaque fill)
    # so `canvas.paste(..., mask)` clips each rectangular photo into a 16px rounded card.
    mask = Image.new("L", (tile_w, tile_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, tile_w - 1, tile_h - 1), radius=16, fill=255)
    tx = mosaic_x + col * (tile_w + gap)
    ty = start_y + row * (tile_h + gap)
    canvas.paste(im, (tx, ty), mask)

    # Stroke a subtle semi-transparent Champagne Stage Gold border (`rgba(245, 196, 81, 90)`)
    # around each rounded tile so dark scenes separate cleanly from the dark `#070B14` canvas.
    ImageDraw.Draw(canvas).rounded_rectangle(
        (tx, ty, tx + tile_w - 1, ty + tile_h - 1),
        radius=16,
        outline=(245, 196, 81, 90),
        width=2,
    )

# Left-hand brand lockup: resize the master Backstage app icon to 132x132,
# clip it with a 30px rounded-squircle mask, and frame it with a warm gold border.
icon = Image.open(icon_path).convert("RGBA").resize((132, 132), Image.Resampling.LANCZOS)
imask = Image.new("L", (132, 132), 0)
ImageDraw.Draw(imask).rounded_rectangle((0, 0, 131, 131), radius=30, fill=255)
canvas.paste(icon, (52, 64), imask)
ImageDraw.Draw(canvas).rounded_rectangle((52, 64, 183, 195), radius=30, outline=(245, 196, 81, 170), width=2)

# Helper to load macOS system TrueType/Collection fonts (`.ttf` / `.ttc`) with graceful fallback:
#   - In a `.ttc` (TrueType Collection) bundle like `Helvetica.ttc`, `index=0` is Regular
#     and `index=1` is Bold.
#   - If none of the candidate font files exist, falls back to Pillow's built-in bitmap font
#     so the script never crashes.
def load_font(paths, size):
    for p, i in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size=size, index=i)
            except Exception:
                pass
    return ImageFont.load_default()

f_kicker = load_font([("/System/Library/Fonts/Helvetica.ttc", 1)], 17)
f_title = load_font([("/System/Library/Fonts/Supplemental/Georgia Bold.ttf", 0), ("/System/Library/Fonts/Helvetica.ttc", 1)], 44)
f_body = load_font([("/System/Library/Fonts/Helvetica.ttc", 0)], 22)
f_url = load_font([("/System/Library/Fonts/Helvetica.ttc", 1)], 19)

# Render left-column editorial typography hierarchy (kicker -> two-tone serif title -> summary copy)
draw = ImageDraw.Draw(canvas)
draw.text((52, 228), "RAGGIESOFT MEDIA • BONUS FEATURES", font=f_kicker, fill=(245, 196, 81, 255))
draw.text((52, 262), "RaggieSoft", font=f_title, fill=(248, 250, 252, 255))
draw.text((52, 314), "Backstage", font=f_title, fill=(245, 196, 81, 255))
draw.text((52, 386), "Behind-the-scenes dossiers, alternate", font=f_body, fill=(203, 213, 225, 255))
draw.text((52, 416), "points of view, campus guides, and", font=f_body, fill=(203, 213, 225, 255))
draw.text((52, 446), "companion archives across every story.", font=f_body, fill=(203, 213, 225, 255))

# Draw bottom pill badge displaying the canonical subdomain (`backstage.raggiesoft.com`)
draw.rounded_rectangle((52, 516, 396, 566), radius=25, fill=(30, 41, 59, 235), outline=(245, 196, 81, 150), width=2)
draw.text((76, 530), "backstage.raggiesoft.com", font=f_url, fill=(245, 196, 81, 255))

# Flatten RGBA -> opaque RGB and save lossless intermediate PNG for `sips` JPEG conversion below.
canvas.convert("RGB").save(out_path, format="PNG")
EOF

# ============================================================================
# STAGE 2 & 3: STANDARDIZED `1200x630` JPEG CONVERSION & AUDIT (`make_og_with_sips`)
# ============================================================================
# Why use macOS `/usr/bin/sips`?
#   `sips` (Scriptable Image Processing System) ships natively with macOS and
#   uses Apple's hardware-accelerated CoreGraphics/ImageIO pipeline to convert,
#   resample, center-crop, and inspect pixel metadata from Bash.
make_og_with_sips() {
    local src="$1"
    local dest="$2"
    local tmp_file
    # Allocate a unique temporary scratch JPEG in `/tmp` (`XXXXXX` is replaced with random chars)
    # so we never mutate source artwork in place.
    tmp_file="$(mktemp /tmp/backstage-og-XXXXXX.jpg)"

    # Step A: Transcode source PNG/JPEG into an 88%-quality JPEG and scale width to 1200px
    # while preserving the original aspect ratio.
    /usr/bin/sips -s format jpeg -s formatOptions 88 "${src}" --out "${tmp_file}" >/dev/null
    /usr/bin/sips --resampleWidth 1200 "${tmp_file}" >/dev/null

    # Step B: Guard against ultra-wide source images!
    # For example, if a source image is 2.2:1, scaling width to 1200px produces a height of ~545px
    # (< 630px). Upscaling height to 630px first ensures `--cropToHeightWidth 630 1200` has at
    # least 630 vertical pixels to center-crop cleanly instead of padding black bars.
    local cur_h
    cur_h="$(/usr/bin/sips -g pixelHeight "${tmp_file}" | awk '/pixelHeight:/ {print $2}')"
    if [ "${cur_h}" -lt 630 ]; then
        /usr/bin/sips --resampleHeight 630 "${tmp_file}" >/dev/null
    fi

    # Step C: Center-crop to exact `630` height x `1200` width (`--cropToHeightWidth H W` takes
    # height FIRST, width SECOND!) and remove the temporary scratch file.
    /usr/bin/sips --cropToHeightWidth 630 1200 "${tmp_file}" --out "${dest}" >/dev/null
    rm -f "${tmp_file}"

    # Step D: Automated Verification Gate — inspect final output dimensions with `sips -g`
    # and fail the build immediately if either dimension deviates from `1200x630`.
    local final_w final_h
    final_w="$(/usr/bin/sips -g pixelWidth "${dest}" | awk '/pixelWidth:/ {print $2}')"
    final_h="$(/usr/bin/sips -g pixelHeight "${dest}" | awk '/pixelHeight:/ {print $2}')"
    if [ "${final_w}" != "1200" ] || [ "${final_h}" != "630" ]; then
        echo "ERROR: ${dest} measured ${final_w}x${final_h} (expected 1200x630)" >&2
        exit 1
    fi
    echo "  ✓ $(basename "${dest}") -> ${final_w}x${final_h}"
}

# 1. Finalize the flagship Backstage Hub card (`backstage-hub-og.jpg`) and delete raw scratch PNG
make_og_with_sips "${OG_DIR}/backstage-hub-og-raw.png" "${OG_DIR}/backstage-hub-og.jpg"
rm -f "${OG_DIR}/backstage-hub-og-raw.png"

# 2. Generate OpenGraph cards for `The Rachel Narrative` hub + individual companion dossiers
make_og_with_sips "${SCENES_DIR}/rachel-bug-and-bear-sanctuary.jpg" "${OG_DIR}/rachel-collection-og.jpg"
make_og_with_sips "${SCENES_DIR}/rachel-wingman-briefing-ashley-bonnie-1999.jpg" "${OG_DIR}/rachel-wingman-og.jpg"
make_og_with_sips "${BOOKS_SCENES}/rachel/b003/chesapeake_courthouse_gavel_1995.jpg" "${OG_DIR}/rachel-david-miller-og.jpg"
make_og_with_sips "${BOOKS_SCENES}/rachel/b003/living_room_base_camp_1995.jpg" "${OG_DIR}/rachel-nurse-iep-og.jpg"
make_og_with_sips "${BOOKS_SCENES}/rachel/b003/midnight_blue_shield_shadow_arts_1995.jpg" "${OG_DIR}/rachel-seonduwon-og.jpg"
make_og_with_sips "${BOOKS_SCENES}/rachel/b004/sovereign_palace_trophy_1999.jpg" "${OG_DIR}/rachel-sloane-brigadoon-og.jpg"
make_og_with_sips "${BOOKS_SCENES}/rachel/b005/christmas_1999_living_room_fortress.jpg" "${OG_DIR}/rachel-black-friday-christmas-og.jpg"
make_og_with_sips "${BOOKS_SCENES}/rachel/b017/jessica-office-sofa.jpg" "${OG_DIR}/rachel-quantum-og.jpg"
make_og_with_sips "${BOOKS_SCENES}/rachel/b018/adult_michael_and_rachel_lynnhaven_dojang.jpg" "${OG_DIR}/rachel-canadian-arch-og.jpg"
make_og_with_sips "${BOOKS_SCENES}/rachel/b023/oct_2026_900pm_rachel_only_vault_hug.jpg" "${OG_DIR}/rachel-susquehanna-og.jpg"

# 3. Generate OpenGraph cards for `Katie & Nathaniel`, `The Eleventh Child`, CPI Campus,
#    `The Stardust Engine` (1986 Origins), and `Vectron Energy Corp.` archives
make_og_with_sips "${SCENES_DIR}/katie-nate-us-senate-corridor.jpg" "${OG_DIR}/katie-collection-og.jpg"
make_og_with_sips "${BOOKS_SCENES}/katie/b006/feb_2027_dirksen_room_511_rrc_dars_appropriation_showdown_katie_nate.jpg" "${OG_DIR}/katie-dirksen-room-511-og.jpg"
make_og_with_sips "${BOOKS_SCENES}/aubrie/baselines/room-214-lived-in-baseline.jpg" "${OG_DIR}/aubrie-collection-og.jpg"
make_og_with_sips "${SCENES_DIR}/cpi-preston-hall-commonwealth-green.jpg" "${OG_DIR}/cpi-campus-og.jpg"
make_og_with_sips "${SCENES_DIR}/cpi-keystone-bridge-commonwealth-mall.jpg" "${OG_DIR}/cpi-keystone-bridge-og.jpg"
make_og_with_sips "${BOOKS_SCENES}/aubrie/e008/c004/p002/stardust-engine-300-marching-forgers.jpg" "${OG_DIR}/stardust-origins-og.jpg"
make_og_with_sips "${BOOKS_SCENES}/aubrie/e007/c001/p003/birth-of-finsharp.jpg" "${OG_DIR}/vectron-archive-og.jpg"

echo "All 18 OpenGraph cards generated and verified at 1200x630 via macOS sips!"
