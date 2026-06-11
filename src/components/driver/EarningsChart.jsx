import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, startOfMonth, subMonths } from 'date-fns';
import { TrendingUp } from 'lucide-react';

export default function EarningsChart({ driverEmail }) {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    (async () => {
      const rides = await base44.entities.Ride.filter(
        { driver_email: driverEmail, status: 'completed' },
        '-created_date',
        200
      );

      // Build last 6 months buckets
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(new Date(), 5 - i);
        return { key: format(d, 'yyyy-MM'), label: format(d, 'MMM'), earnings: 0 };
      });

      rides.forEach((r) => {
        const key = format(new Date(r.created_date), 'yyyy-MM');
        const bucket = months.find((m) => m.key === key);
        if (bucket) bucket.earnings += (r.fare || 0) * 0.8;
      });

      setChartData(months);
    })();
  }, [driverEmail]);

  const total = chartData.reduce((s, m) => s + m.earnings, 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Earnings (last 6 months)</span>
        </div>
        <span className="text-xs text-muted-foreground font-medium">${total.toFixed(0)} total</span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
            width={36}
          />
          <Tooltip
            formatter={(v) => [`$${v.toFixed(2)}`, 'Earnings']}
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            cursor={{ fill: 'hsl(var(--accent))' }}
          />
          <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}