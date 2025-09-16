import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import { useGameStore } from '../state/gameStore';

// PUBLIC_INTERFACE
export default function VectorFieldPlot() {
  /** Plotly-based quiver plot of the vector field. */
  const ref = useRef(null);
  const { bounds, samples, compileEquations } = useGameStore();

  useEffect(() => {
    let compiled;
    try { compiled = compileEquations(); } catch { compiled = null; }
    const node = ref.current;
    if (!node) return;

    const { xMin, xMax, yMin, yMax } = bounds;
    const xs = [];
    const ys = [];
    const us = [];
    const vs = [];
    const nx = samples, ny = samples;

    for (let i=0; i<nx; i++) {
      for (let j=0; j<ny; j++) {
        const x = xMin + (i+0.5)*(xMax-xMin)/nx;
        const y = yMin + (j+0.5)*(yMax-yMin)/ny;
        xs.push(x);
        ys.push(y);
        const u = compiled ? compiled.fx(x,y,0) : 0;
        const v = compiled ? compiled.fy(x,y,0) : 0;
        us.push(u);
        vs.push(v);
      }
    }

    const data = [{
      type: 'cone',
      x: xs,
      y: ys,
      z: ys.map(()=>0),
      u: us,
      v: vs,
      w: vs.map(()=>0),
      sizemode: 'absolute',
      sizeref: 5,
      colorscale: 'Blues',
      showscale: false,
    }];

    const layout = {
      margin: { l: 10, r: 10, t: 10, b: 10 },
      scene: { visible: false },
      xaxis: { range: [xMin, xMax] },
      yaxis: { range: [yMin, yMax] },
      width: node.clientWidth,
      height: 300,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
    };

    Plotly.newPlot(node, data, layout, { displayModeBar: false });
    return () => Plotly.purge(node);
  }, [bounds, samples, compileEquations]);

  return (
    <div className="panel">
      <h3>Vector Field (Plotly)</h3>
      <div ref={ref} />
    </div>
  );
}
