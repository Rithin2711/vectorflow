import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

/**
 * PUBLIC_INTERFACE
 * VectorFieldQuiver renders an SVG quiver of the vector field over the simulation area.
 * Props:
 * - width, height
 * - field(x,y,t) -> {fx, fy}
 * - t (time)
 * - show (boolean)
 */
export default function VectorFieldQuiver({ width, height, field, t, show }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!show) {
      if (ref.current) ref.current.innerHTML = '';
      return;
    }
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const cols = 24;
    const rows = 12;
    const dx = width / cols;
    const dy = height / rows;

    const g = svg.append('g');
    const maxLen = 16;

    for (let i = 0; i <= cols; i++) {
      for (let j = 0; j <= rows; j++) {
        const x = i * dx + dx * 0.5;
        const y = j * dy + dy * 0.5;
        const v = field(x, y, t);
        let len = Math.hypot(v.fx, v.fy);
        if (!Number.isFinite(len) || len === 0) continue;
        const scale = Math.min(maxLen, 10 + 20 * Math.tanh(len / 5)) / len;
        const x2 = x + v.fx * scale;
        const y2 = y + v.fy * scale;

        g.append('line')
          .attr('x1', x).attr('y1', y).attr('x2', x2).attr('y2', y2)
          .attr('stroke', '#58a6ff')
          .attr('stroke-opacity', 0.7)
          .attr('stroke-width', 1.2);

        const angle = Math.atan2(y2 - y, x2 - x);
        const ah = 6;
        const p1x = x2 - ah * Math.cos(angle - Math.PI / 6);
        const p1y = y2 - ah * Math.sin(angle - Math.PI / 6);
        const p2x = x2 - ah * Math.cos(angle + Math.PI / 6);
        const p2y = y2 - ah * Math.sin(angle + Math.PI / 6);

        g.append('path')
          .attr('d', `M${x2},${y2} L${p1x},${p1y} L${p2x},${p2y} Z`)
          .attr('fill', '#58a6ff')
          .attr('fill-opacity', 0.7);
      }
    }
  }, [width, height, field, t, show]);

  return <svg ref={ref} width={width} height={height} />;
}
