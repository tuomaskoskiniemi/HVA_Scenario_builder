import type { ReactNode } from 'react';
import { MUNICIPALITIES, REGION_OUTLINE, type Municipality } from '../data/municipalities';

const VB_W = 800;
const VB_H = 920;

interface RegionMapProps {
  ariaLabel: string;
  /** Fill colour per municipality. */
  fill: (m: Municipality) => string;
  /** Extra SVG drawn above the municipality shapes (labels, markers, legends). */
  svgChildren?: ReactNode;
  /** HTML overlay (buttons) positioned with `mapPos`. */
  children?: ReactNode;
  northArrow?: { x: number; y: number };
}

/** Schematic map of the 18 municipalities. Scales to its container width. */
export function RegionMap({ ariaLabel, fill, svgChildren, children, northArrow = { x: 720, y: 800 } }: RegionMapProps) {
  return (
    <figure className="region-map">
      <svg role="img" aria-label={ariaLabel} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <g stroke="var(--bg)" strokeWidth={2.5} strokeLinejoin="round">
          {MUNICIPALITIES.map((m) => (
            <path key={m.key} d={m.d} fill={fill(m)} />
          ))}
        </g>
        <path d={REGION_OUTLINE} fill="none" stroke="var(--ink)" strokeWidth={1.5} strokeLinejoin="round" />
        {svgChildren}
        <g transform={`translate(${northArrow.x},${northArrow.y})`} fill="var(--ink)" aria-hidden="true">
          <path d="M0,-34L9,0L0,-6L-9,0Z" />
          <text y={18} textAnchor="middle" fontSize={13} fontWeight={600}>
            P
          </text>
        </g>
      </svg>
      {children}
    </figure>
  );
}

/** CSS position for an HTML overlay element centred on a map coordinate. */
export function mapPos(x: number, y: number) {
  return { left: `${(x / VB_W) * 100}%`, top: `${(y / VB_H) * 100}%` };
}
