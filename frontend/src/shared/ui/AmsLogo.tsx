import type { SVGProps } from 'react'

interface AmsMarkIconProps extends SVGProps<SVGSVGElement> {
  size?: string | number
}

/**
 * AMS brand mark — filled map-pin silhouette with circular hole.
 * Uses `currentColor` so it inherits any `text-*` / `color` from the parent.
 * Rendered via SVG mask so the hole is always transparent (theme-agnostic).
 */
export function AmsMarkIcon({ size = '1em', className, ...props }: AmsMarkIconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <defs>
        <mask id="ams-pin-mask">
          {/* Pin silhouette — white = visible */}
          <path
            d="M10 2C14.7 2 16.5 5 16.5 8.5C16.5 13 12 16 10 19.5C8 16 3.5 13 3.5 8.5C3.5 5 5.3 2 10 2Z"
            fill="white"
          />
          {/* Inner circle — black = cutout / transparent hole */}
          <circle cx="10" cy="8" r="3" fill="black" />
        </mask>
      </defs>
      {/* Single rect fills the entire viewport with currentColor, clipped by the mask */}
      <rect x="0" y="0" width="20" height="20" fill="currentColor" mask="url(#ams-pin-mask)" />
    </svg>
  )
}
