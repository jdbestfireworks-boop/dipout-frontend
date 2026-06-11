import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, Car } from 'lucide-react';

export default function DailyRevenueChart({ rides }) {
  // Get last 7 days of data
  const getLast7DaysData = () => {
    const today = new Date();
    const days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    
    return days.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const dayRides = rides.filter(
        r => r.status === 'completed' && 
             r.payment_status === 'paid' && 
             r.created_date.startsWith(dateStr)
      );
      const revenue = dayRides.reduce((sum, r) => sum + (r.fare || 0), 0);
      
      return {
        date: dateStr,
        display: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        revenue: Math.round(revenue * 100) / 100,
        rides: dayRides.length,
      };
    });
  };

  const data = getLast7DaysData();
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const hasData = data.some(d => d.revenue > 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2">{data.display}</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Revenue
              </span>
              <span className="font-bold text-primary">${data.revenue.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Car className="w-3 h-3" /> Rides
              </span>
              <span className="font-bold text-green-500">{data.rides}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!hasData) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <DollarSign className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">No revenue data yet</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Complete some rides to see daily revenue trends
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary fill-primary" />
            Daily Performance
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Total: <span className="font-bold text-primary">${totalRevenue.toFixed(2)}</span>
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-primary"></div>
            <span className="text-muted-foreground">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-green-500"></div>
            <span className="text-muted-foreground">Ride Volume</span>
          </div>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis 
              dataKey="display" 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              dy={5}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              yAxisId="left"
              dataKey="revenue" 
              fill="hsl(var(--primary))" 
              radius={[6, 6, 0, 0]}
              animationDuration={1000}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="rides" 
              stroke="hsl(142, 76%, 36%)" 
              strokeWidth={3}
              dot={{ fill: 'hsl(142, 76%, 36%)', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6 }}
              animationDuration={1000}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}