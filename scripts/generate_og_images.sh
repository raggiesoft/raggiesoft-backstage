#!/bin/bash
# ============================================================================
# ARCHITECTURAL BLOCK COMMENT: generate_og_images.sh (RaggieSoft Backstage)
# ============================================================================
# Purpose:
#     Generates and verifies exact `1200x630` (1.91:1 OpenGraph & Twitter
#     `summary_large_image` standard) JPEG cards for RaggieSoft Backstage
#     (`https://backstage.raggiesoft.com`) using macOS `/usr/bin/sips`.
#
# Pipeline:
#     1. Builds a flagship co-branded `backstage-hub-og.jpg` hero card showing
#        a 2x2 showcase of RaggieSoft Backstage scenes alongside the Backstage
#        squircle crest and title lockup, then runs `sips` to enforce exact
#        `1200x630` JPEG encoding.
#     2. Runs macOS `sips` (`--resampleWidth 1200` + `--cropToHeightWidth 630 1200`)
#        across every collection and dossier artwork so social link unfurls on
#        iMessage, Discord, Slack, Bluesky, X, Mastodon, and search engines
#        never fetch oversized raw PNGs or mismatched aspect ratios.
#     3. Explicitly audits every generated file via `sips -g pixelWidth -g pixelHeight`
#        and exits non-zero if any card deviates from `1200` x `630`.
# ============================================================================

set -euo pipefail

cd "$(dirname "$0")/.." || exit 1

ASSETS_ROOT="$(cd ../../../raggiesoft-assets && pwd)"
OG_DIR="${ASSETS_ROOT}/raggiesoft-backstage/images/og"
SCENES_DIR="${ASSETS_ROOT}/raggiesoft-backstage/images/scenes"
LOGOS_DIR="${ASSETS_ROOT}/raggiesoft-backstage/images/logos"
BOOKS_SCENES="${ASSETS_ROOT}/raggiesoft-books/images/scenes"

mkdir -p "${OG_DIR}"

echo "Building flagship RaggieSoft Backstage Hub composite card..."

/opt/homebrew/bin/python3 - "${OG_DIR}/backstage-hub-og-raw.png" "${LOGOS_DIR}/backstage-app-icon.png" "${SCENES_DIR}" << 'EOF'
import sys, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

out_path, icon_path, scenes_dir = sys.argv[1], sys.argv[2], sys.argv[3]
W, H = 1200, 630
canvas = Image.new("RGBA", (W, H), (7, 11, 20, 255))

# Right-hand 2x2 cinematic mosaic of Backstage worlds
tiles = [
    os.path.join(scenes_dir, "rachel-bug-and-bear-sanctuary.jpg"),
    os.path.join(scenes_dir, "katie-nate-us-senate-corridor.jpg"),
    os.path.join(scenes_dir, "cpi-preston-hall-commonwealth-green.jpg"),
    os.path.join(scenes_dir, "rachel-wingman-briefing-ashley-bonnie-1999.jpg"),
]
mosaic_x = 560
tile_w, tile_h = 304, 291
gap = 12
start_y = 18

for idx, tpath in enumerate(tiles):
    col = idx % 2
    row = idx // 2
    im = Image.open(tpath).convert("RGB")
    # Center-crop to tile aspect
    target_ratio = tile_w / tile_h
    iw, ih = im.size
    if (iw / ih) > target_ratio:
        nw = int(round(ih * target_ratio))
        left = (iw - nw) // 2
        im = im.crop((left, 0, left + nw, ih))
    else:
        nh = int(round(iw / target_ratio))
        top = max(0, (ih - nh) // 3)
        im = im.crop((0, top, iw, top + nh))
    im = im.resize((tile_w, tile_h), Image.Resampling.LANCZOS)
    mask = Image.new("L", (tile_w, tile_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, tile_w - 1, tile_h - 1), radius=16, fill=255)
    tx = mosaic_x + col * (tile_w + gap)
    ty = start_y + row * (tile_h + gap)
    canvas.paste(im, (tx, ty), mask)
    ImageDraw.Draw(canvas).rounded_rectangle(
        (tx, ty, tx + tile_w - 1, ty + tile_h - 1),
        radius=16,
        outline=(245, 196, 81, 90),
        width=2,
    )

# Left-hand brand lockup
icon = Image.open(icon_path).convert("RGBA").resize((132, 132), Image.Resampling.LANCZOS)
imask = Image.new("L", (132, 132), 0)
ImageDraw.Draw(imask).rounded_rectangle((0, 0, 131, 131), radius=30, fill=255)
canvas.paste(icon, (52, 64), imask)
ImageDraw.Draw(canvas).rounded_rectangle((52, 64, 183, 195), radius=30, outline=(245, 196, 81, 170), width=2)

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

draw = ImageDraw.Draw(canvas)
draw.text((52, 228), "RAGGIESOFT MEDIA • BONUS FEATURES", font=f_kicker, fill=(245, 196, 81, 255))
draw.text((52, 262), "RaggieSoft", font=f_title, fill=(248, 250, 252, 255))
draw.text((52, 314), "Backstage", font=f_title, fill=(245, 196, 81, 255))
draw.text((52, 386), "Behind-the-scenes dossiers, alternate", font=f_body, fill=(203, 213, 225, 255))
draw.text((52, 416), "points of view, campus guides, and", font=f_body, fill=(203, 213, 225, 255))
draw.text((52, 446), "companion archives across every story.", font=f_body, fill=(203, 213, 225, 255))

draw.rounded_rectangle((52, 516, 396, 566), radius=25, fill=(30, 41, 59, 235), outline=(245, 196, 81, 150), width=2)
draw.text((76, 530), "backstage.raggiesoft.com", font=f_url, fill=(245, 196, 81, 255))

canvas.convert("RGB").save(out_path, format="PNG")
EOF

make_og_with_sips() {
    local src="$1"
    local dest="$2"
    local tmp_file
    tmp_file="$(mktemp /tmp/backstage-og-XXXXXX.jpg)"

    # Convert to high-quality JPEG and resample width to 1200px via macOS sips
    /usr/bin/sips -s format jpeg -s formatOptions 88 "${src}" --out "${tmp_file}" >/dev/null
    /usr/bin/sips --resampleWidth 1200 "${tmp_file}" >/dev/null

    # Ensure height is at least 630px before center-cropping to 630x1200
    local cur_h
    cur_h="$(/usr/bin/sips -g pixelHeight "${tmp_file}" | awk '/pixelHeight:/ {print $2}')"
    if [ "${cur_h}" -lt 630 ]; then
        /usr/bin/sips --resampleHeight 630 "${tmp_file}" >/dev/null
    fi

    /usr/bin/sips --cropToHeightWidth 630 1200 "${tmp_file}" --out "${dest}" >/dev/null
    rm -f "${tmp_file}"

    local final_w final_h
    final_w="$(/usr/bin/sips -g pixelWidth "${dest}" | awk '/pixelWidth:/ {print $2}')"
    final_h="$(/usr/bin/sips -g pixelHeight "${dest}" | awk '/pixelHeight:/ {print $2}')"
    if [ "${final_w}" != "1200" ] || [ "${final_h}" != "630" ]; then
        echo "ERROR: ${dest} measured ${final_w}x${final_h} (expected 1200x630)" >&2
        exit 1
    fi
    echo "  ✓ $(basename "${dest}") -> ${final_w}x${final_h}"
}

make_og_with_sips "${OG_DIR}/backstage-hub-og-raw.png" "${OG_DIR}/backstage-hub-og.jpg"
rm -f "${OG_DIR}/backstage-hub-og-raw.png"

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

make_og_with_sips "${SCENES_DIR}/katie-nate-us-senate-corridor.jpg" "${OG_DIR}/katie-collection-og.jpg"
make_og_with_sips "${BOOKS_SCENES}/katie/b006/feb_2027_dirksen_room_511_rrc_dars_appropriation_showdown_katie_nate.jpg" "${OG_DIR}/katie-dirksen-room-511-og.jpg"
make_og_with_sips "${BOOKS_SCENES}/aubrie/baselines/room-214-lived-in-baseline.jpg" "${OG_DIR}/aubrie-collection-og.jpg"
make_og_with_sips "${SCENES_DIR}/cpi-preston-hall-commonwealth-green.jpg" "${OG_DIR}/cpi-campus-og.jpg"
make_og_with_sips "${SCENES_DIR}/cpi-keystone-bridge-commonwealth-mall.jpg" "${OG_DIR}/cpi-keystone-bridge-og.jpg"
make_og_with_sips "${BOOKS_SCENES}/aubrie/e008/c004/p002/stardust-engine-300-marching-forgers.jpg" "${OG_DIR}/stardust-origins-og.jpg"
make_og_with_sips "${BOOKS_SCENES}/aubrie/e007/c001/p003/birth-of-finsharp.jpg" "${OG_DIR}/vectron-archive-og.jpg"

echo "All 18 OpenGraph cards generated and verified at 1200x630 via macOS sips!"
