import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const PRChart: React.FC = () => {
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
              data: [{x: 0, y: 1}, {x: 0.1, y: 0.95}, {x: 0.2, y: 0.92}, {x: 0.3, y: 0.88}, {x: 0.4, y: 0.83}, {x: 0.5, y: 0.78}, {x: 0.6, y: 0.72}, {x: 0.7, y: 0.65}, {x: 0.8, y: 0.55}, {x: 0.9, y: 0.4}, {x: 1, y: 0.1}],
              borderColor: '#69D8EE',
              backgroundColor: 'rgba(105, 216, 238, 0.2)',
              borderWidth: 2,
              fill: true,
              tension: 0.1
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
                  text: 'Recall'
                }
              },
              y: {
                title: {
                  display: true,
                  text: 'Precision'
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

export default PRChart;