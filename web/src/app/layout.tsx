import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Fraunces, Manrope, Nunito } from "next/font/google";
import { MotionProvider } from "@/components/MotionProvider";
import { AppPaperSkin } from "@/components/AppPaperSkin";
import { LoopSkin } from "@/components/LoopSkin";
import { APP_PAPER_INLINE } from "@/lib/app-paper-skin";
import { HALO_BOOT_INLINE } from "@/lib/halo-boot";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const display = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const body = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const chip = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Cove",
  description: "Invite-only family Ask — private, calm, glass.",
};

/**
 * Displacement maps for the lens filters. Grey 128 = no offset, so the ramps
 * only bend the backdrop where they leave neutral: at the edges.
 * One map per axis (R drives x, G drives y) chained through two
 * feDisplacementMaps, which keeps each map a single linear gradient.
 */
function map(stops: string, vertical: boolean) {
  const coords = vertical
    ? 'x1="0" y1="0" x2="0" y2="1"'
    : 'x1="0" y1="0" x2="1" y2="0"';
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">` +
    `<linearGradient id="g" ${coords}>${stops}</linearGradient>` +
    `<rect width="200" height="200" fill="url(#g)"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const stop = (offset: number, value: number, vertical: boolean) =>
  `<stop offset="${offset}" stop-color="rgb(${vertical ? 128 : value},${
    vertical ? value : 128
  },128)"/>`;

/** Neutral through the middle, hard bend inside the last ~14% of each edge. */
const edgeRamp = (vertical: boolean) =>
  stop(0, 0, vertical) +
  stop(0.14, 128, vertical) +
  stop(0.86, 128, vertical) +
  stop(1, 255, vertical);

/** Whole-surface lens: reads as a thick glass bead on small shapes. */
const beadRamp = (vertical: boolean) =>
  stop(0, 0, vertical) +
  stop(0.22, 78, vertical) +
  stop(0.5, 128, vertical) +
  stop(0.78, 178, vertical) +
  stop(1, 255, vertical);

const LENS = {
  edgeH: map(edgeRamp(false), false),
  edgeV: map(edgeRamp(true), true),
  beadH: map(beadRamp(false), false),
  beadV: map(beadRamp(true), true),
};

function HaloFilters() {
  return (
    <svg className="halo-defs" aria-hidden focusable="false">
      <defs>
        <filter
          id="halo-lens"
          primitiveUnits="objectBoundingBox"
          colorInterpolationFilters="sRGB"
        >
          <feImage
            href={LENS.edgeH}
            x="0"
            y="0"
            width="1"
            height="1"
            preserveAspectRatio="none"
            result="lensX"
          />
          <feImage
            href={LENS.edgeV}
            x="0"
            y="0"
            width="1"
            height="1"
            preserveAspectRatio="none"
            result="lensY"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="lensX"
            scale="0.02"
            xChannelSelector="R"
            yChannelSelector="G"
            result="bentX"
          />
          <feDisplacementMap
            in="bentX"
            in2="lensY"
            scale="0.02"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <filter
          id="halo-lens-bead"
          primitiveUnits="objectBoundingBox"
          colorInterpolationFilters="sRGB"
        >
          <feImage
            href={LENS.beadH}
            x="0"
            y="0"
            width="1"
            height="1"
            preserveAspectRatio="none"
            result="beadX"
          />
          <feImage
            href={LENS.beadV}
            x="0"
            y="0"
            width="1"
            height="1"
            preserveAspectRatio="none"
            result="beadY"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="beadX"
            scale="0.055"
            xChannelSelector="R"
            yChannelSelector="G"
            result="beadBentX"
          />
          <feDisplacementMap
            in="beadBentX"
            in2="beadY"
            scale="0.055"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hdrs = await headers();
  const previewSkin = hdrs.get("x-halo-home-skin");
  const homeSkin = previewSkin === "ours" ? "ours" : "paper";
  const homeTheme = hdrs.get("x-halo-theme") === "dark" ? "dark" : "light";
  return (
    <html
      lang="en"
      data-halo-motion="full"
      data-halo-bg="mist"
      data-halo-theme={homeTheme}
      data-home-skin={homeSkin}
      data-halo-loop="17"
      data-halo-ready="1"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${chip.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        <script dangerouslySetInnerHTML={{ __html: HALO_BOOT_INLINE }} />
        <script dangerouslySetInnerHTML={{ __html: APP_PAPER_INLINE }} />
        <div className="halo-filter-warmup" aria-hidden />
        <HaloFilters />
        <LoopSkin />
        <AppPaperSkin />
        <MotionProvider>{children}</MotionProvider>
        {/* Future overlay portal. No UI. Do not bolt menus onto HaloHeader. */}
        <div id="cove-overlay" />
      </body>
    </html>
  );
}
