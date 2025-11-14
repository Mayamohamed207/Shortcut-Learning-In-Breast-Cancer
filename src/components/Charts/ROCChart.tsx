import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const ROCChart: React.FC = () => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            datasets: [{
              label: 'YALA Model',
              data: [{x: 0, y: 0}, {x: 0.1, y: 0.3}, {x: 0.2, y: 0.55}, {x: 0.3, y: 0.72}, {x: 0.4, y: 0.82}, {x: 0.5, y: 0.88}, {x: 0.6, y: 0.91}, {x: 0.7, y: 0.94}, {x: 0.8, y: 0.96}, {x: 0.9, y: 0.98}, {x: 1, y: 1}],
              borderColor: '#FF96A7',
              backgroundColor: 'rgba(255, 150, 167, 0.1)',
              borderWidth: 2,
              fill: false,
              tension: 0.1
            }, {
              label: 'Baseline',
              data: [{x: 0, y: 0}, {x: 1, y: 1}],
              borderColor: '#cbd5e0',
              borderWidth: 1,
              borderDash: [5, 5],
              fill: false
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'False Positive Rate'
                }
              },
              y: {
                title: {
                  display: true,
                  text: 'True Positive Rate'
                }
              }
            }
          }
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  return <canvas ref={chartRef} style={{ height: '250px' }} />;
};

export default ROCChart;