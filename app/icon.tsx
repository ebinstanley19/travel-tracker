import { ImageResponse } from "next/og";
import { LOGO_VARIANT } from "@/app/travel-tracker/brand-config";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(145deg, #0f2a4a 0%, #1a4f86 55%, #4e8fcd 100%)",
            borderRadius: "50%",
          }}
        >
        <svg viewBox="0 0 512 512" width="420" height="420" fill="none" xmlns="http://www.w3.org/2000/svg">
          {LOGO_VARIANT === "orbit" ? (
            <g>
              <defs>
                <radialGradient id="globe" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(256 256) rotate(90) scale(170)">
                  <stop offset="0%" stopColor="#9ED3FF" />
                  <stop offset="75%" stopColor="#4D88C5" />
                  <stop offset="100%" stopColor="#2F5E98" />
                </radialGradient>
              </defs>

              <circle cx="256" cy="256" r="172" fill="url(#globe)" />
              <circle cx="256" cy="256" r="172" stroke="#DDF0FF" strokeWidth="10" opacity="0.86" />

              <ellipse cx="256" cy="256" rx="118" ry="171" stroke="#DDEEFF" strokeWidth="8" opacity="0.5" />
              <ellipse cx="256" cy="256" rx="56" ry="171" stroke="#DDEEFF" strokeWidth="8" opacity="0.32" />
              <path d="M96 256H416" stroke="#DDEEFF" strokeWidth="8" opacity="0.44" />
              <path d="M128 197C178 223 334 223 384 197" stroke="#DDEEFF" strokeWidth="8" opacity="0.38" />
              <path d="M128 315C178 289 334 289 384 315" stroke="#DDEEFF" strokeWidth="8" opacity="0.38" />

              <ellipse cx="256" cy="256" rx="210" ry="94" transform="rotate(-24 256 256)" stroke="#FFFFFF" strokeWidth="14" opacity="0.9" />

              <g transform="translate(376 142) rotate(-24)">
                <path d="M0 0L60 18L18 36L0 0Z" fill="#FFFFFF" />
                <path d="M8 8L20 30" stroke="#1A4F86" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
              </g>
            </g>
          ) : null}

          {LOGO_VARIANT === "minimal" ? (
            <g>
              <circle cx="256" cy="256" r="170" stroke="#DDF0FF" strokeWidth="12" opacity="0.92" />
              <path d="M86 256H426" stroke="#DDF0FF" strokeWidth="10" strokeLinecap="round" />
              <path d="M256 86V426" stroke="#DDF0FF" strokeWidth="10" strokeLinecap="round" opacity="0.75" />
              <path d="M161 162C193 189 319 189 351 162" stroke="#DDF0FF" strokeWidth="10" strokeLinecap="round" opacity="0.7" />
              <path d="M161 350C193 323 319 323 351 350" stroke="#DDF0FF" strokeWidth="10" strokeLinecap="round" opacity="0.7" />
              <path d="M336 173L388 188L353 212L336 173Z" fill="#FFFFFF" />
            </g>
          ) : null}

          {LOGO_VARIANT === "stamp" ? (
            <g>
              <rect x="116" y="116" width="280" height="280" rx="48" fill="rgba(234,246,255,0.14)" stroke="#DDF0FF" strokeWidth="12" />
              <circle cx="256" cy="256" r="88" stroke="#DDF0FF" strokeWidth="10" />
              <path d="M170 256H342" stroke="#DDF0FF" strokeWidth="8" strokeLinecap="round" />
              <path d="M256 170V342" stroke="#DDF0FF" strokeWidth="8" strokeLinecap="round" opacity="0.78" />
              <path d="M305 205L351 219L319 241L305 205Z" fill="#FFFFFF" />
            </g>
          ) : null}
        </svg>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}