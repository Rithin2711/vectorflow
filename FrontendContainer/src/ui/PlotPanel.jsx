import React, { useEffect, useRef } from 'react';

/**
 * PUBLIC_INTERFACE
 * PlotPanel - placeholder for Plotly visualizations; currently renders a lightweight canvas of speed over time.
 */
export default function PlotPanel() {
  const canvasRef = useRef(null);
  const bufferRef = useRef([]);

  useEffect(() => {
    const onTick = (e) => {
      if (e?.detail?.type === 'sim-metric') {
        const arr = bufferRef.current;
        arr.push(e.detail.value || 0);
        if (arr.length > 200) arr.shift();
        draw(arr);
      }
    };
    window.addEventListener('vf-event', onTick);
    return () => window.removeEventListener('vf-event', onTick);
  }, []);

  const draw = (arr) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const w = c.width, h = c.height;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = '#0a0d12';
    ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = '#3fb950';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const max = Math.max(1, ...arr);
    arr.forEach((v, i) => {
      const x = (i / (arr.length - 1 || 1)) * (w - 20) + 10;
      const y = h - 10 - (v / max) * (h - 20);
      if (i === 0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.stroke();
    ctx.strokeStyle = '#2a2f37';
    ctx.strokeRect(0.5, 0.5, w-1, h-1);
  };

  return (
    <div>
      <div className="small" style={{marginBottom:6}}>Speed over time (lightweight canvas plot)</div>
      <canvas ref={canvasRef} width={800} height={180} style={{width:'100%', height:180, display:'block'}} />
    </div>
  );
}
