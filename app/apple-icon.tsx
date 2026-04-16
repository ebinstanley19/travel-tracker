import { ImageResponse } from "next/og";
import { LOGO_VARIANT } from "@/app/travel-tracker/brand-config";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "34px",
          background: "linear-gradient(145deg, #0f2a4a 0%, #1a4f86 55%, #4e8fcd 100%)",
        }}
      >
        <svg viewBox="0 0 180 180" width="154" height="154" fill="none" xmlns="http://www.w3.org/2000/svg">
          {LOGO_VARIANT === "orbit" ? (
            <g>
              <circle cx="90" cy="90" r="58" fill="#5FA2DF" />
              <circle cx="90" cy="90" r="58" stroke="#EAF6FF" strokeWidth="5" opacity="0.9" />
              <ellipse cx="90" cy="90" rx="84" ry="38" transform="rotate(-24 90 90)" stroke="#FFFFFF" strokeWidth="6" opacity="0.92" />
              <g transform="translate(133 49) rotate(-24)">
                <path d="M0 0L22 6L7 14L0 0Z" fill="#FFFFFF" />
              </g>
            </g>
          ) : null}

          {LOGO_VARIANT === "minimal" ? (
            <g>
              <circle cx="90" cy="90" r="58" stroke="#EAF6FF" strokeWidth="6" />
              <path d="M32 90H148" stroke="#EAF6FF" strokeWidth="5" strokeLinecap="round" />
              <path d="M90 32V148" stroke="#EAF6FF" strokeWidth="5" strokeLinecap="round" opacity="0.75" />
              <path d="M116 56L133 61L121 69L116 56Z" fill="#FFFFFF" />
            </g>
          ) : null}

          {LOGO_VARIANT === "stamp" ? (
            <g>
              <rect x="39" y="39" width="102" height="102" rx="18" fill="rgba(234,246,255,0.14)" stroke="#EAF6FF" strokeWidth="4" />
              <circle cx="90" cy="90" r="32" stroke="#EAF6FF" strokeWidth="4" />
              <path d="M58 90H122" stroke="#EAF6FF" strokeWidth="3" strokeLinecap="round" />
              <path d="M90 58V122" stroke="#EAF6FF" strokeWidth="3" strokeLinecap="round" opacity="0.78" />
              <path d="M106 71L123 76L111 84L106 71Z" fill="#FFFFFF" />
            </g>
          ) : null}
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}