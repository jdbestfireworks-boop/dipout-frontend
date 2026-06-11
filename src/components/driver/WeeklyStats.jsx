import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { startOfWeek, endOfWeek, subWeeks, format, eachDayOfInterval } from 'date-fns';
import { DollarSign, Navigation, Star, TrendingUp, Clock } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

export default function WeeklyStats({ profile, driverEmail }) {
  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const weekEnd = useMemo(() => endOfWeek(new Date(), { weekStartsOn: 1 }), []);

  const { data: allRides = [] } = useQuery({
    queryKey: ['driver-weekly-stats', driverEmail],
    queryFn: () => base44.entities.Ride.filter({ driver_email: driverEmail, status: 'completed' }, '-created_date', 300),
    enabled: !!driverEmail,
  });

  const weeklyRides = useMemo(() =>
    allRides.filter((r) => {
      const d = new Date(r.created_date);
      return d >= weekStart && d <= weekEnd;
    }),
  [allRides, weekStart, weekEnd]);

  const weeklyEarnings = useMemo(() =>
    weeklyRides.reduce((sum, r) => sum + (r.fare || 0) * 0.8, 0),
  [weeklyRides]);

  const weeklyTrips = weeklyRides.length;

  // Average rating this week (rides that have a rating linked — use profile overall as fallback)
  const avgRating = profile.rating || 5;

  // Daily earnings chart data
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const chartData = days.map((day) => {
    const dayLabel = format(day, 'EEE');
    const dayEarnings = weeklyRides
      .filter((r) => format(new Date(r.created_date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
      .reduce((sum, r) => sum + (r.fare || 0) * 0.8, 0);
    const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    return { day: dayLabel, earnings: parseFloat(dayEarnings.toFixed(2)), isToday };
  });

  const bestDay = chartData.reduce((best, d) => d.earnings > best.earnings ? d : best, chartData[0]);

  // 4-week trend data
  const fourWeekData = useMemo(() => {
    return [3, 2, 1, 0].map((weeksAgo) => {
      const wStart = startOfWeek(subWeeks(new Date(), weeksAgo), { weekStartsOn: 1 });
      const wEnd = endOfWeek(subWeeks(new Date(), weeksAgo), { weekStartsOn: 1 });
      const label = weeksAgo === 0 ? 'This wk' : weeksAgo === 1 ? 'Last wk' : `${weeksAgo}w ago`;
      const weekRides = allRides.filter((r) => {
        const d = new Date(r.created_date);
        return d >= wStart && d <= wEnd;
      });
      const earnings = parseFloat(weekRides.reduce((sum, r) => sum + (r.fare || 0) * 0.8, 0).toFixed(2));
      return { label, earnings, trips: weekRides.length };
    });
  }, [allRides]);

  const stats = [
    {
      label: 'Earnings this week',
      value: `$${weeklyEarnings.toFixed(2)}`,
      icon: DollarSign,
      sub: `${weeklyTrips} trip${weeklyTrips !== 1 ? 's' : ''}`,
    },
    {
      label: 'Trips this week',
      value: weeklyTrips,
      icon: Navigation,
      sub: `All-time: ${profile.trips_completed || 0}`,
    },
    {
      label: 'Avg rating',
      value: avgRating.toFixed(1),
      icon: Star,
      sub: `${profile.total_ratings || 0} total reviews`,
      filled: true,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Period label */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold">Weekly Performance</h2>
        <span className="text-xs text-muted-foreground">
          {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d')}
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ label, value, icon: Icon, sub, filled }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-3 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className={`w-4 h-4 text-primary ${filled ? 'fill-primary' : ''}`} />
            </div>
            <div>
              <p className="font-display font-bold text-xl leading-none">{value}</p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{label}</p>
            </div>
            <p className="text-[10px] text-muted-foreground border-t border-border pt-1.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Daily earnings bar chart */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Daily Earnings</p>
          {bestDay?.earnings > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-primary" />
              Best: {bestDay.day} ${bestDay.earnings.toFixed(0)}
            </span>
          )}
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={chartData} barSize={24}>
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              formatter={(v) => [`$${v.toFixed(2)}`, 'Earned']}
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                fontSize: '12px',
              }}
              cursor={{ fill: 'hsl(var(--accent))' }}
            />
            <Bar dataKey="earnings" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.isToday ? 'hsl(var(--primary))' : 'hsl(var(--secondary))'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-muted-foreground text-center mt-1">Today highlighted in gold</p>
      </div>

      {/* 4-week trend chart */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <p className="text-sm font-semibold">4-Week Trend</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={fourWeekData} barGap={4} barSize={20}>
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="earnings" hide />
            <YAxis yAxisId="trips" orientation="right" hide />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                fontSize: '12px',
              }}
              formatter={(v, name) => name === 'earnings' ? [`$${v.toFixed(2)}`, 'Earnings'] : [v, 'Trips']}
              cursor={{ fill: 'hsl(var(--accent))' }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(v) => <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{v === 'earnings' ? 'Earnings' : 'Trips'}</span>}
            />
            <Bar yAxisId="earnings" dataKey="earnings" radius={[6,6,0,0]} fill="hsl(var(--primary))" opacity={0.9} />
            <Bar yAxisId="trips" dataKey="trips" radius={[6,6,0,0]} fill="hsl(var(--secondary))" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* All-time footer */}
      <div className="rounded-2xl border border-border bg-card px-4 py-3 flex items-center justify-between text-sm">
        <span className="text-muted-foreground flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> All-time earnings
        </span>
        <span className="font-bold">${(profile.total_earnings || 0).toFixed(2)}</span>
      </div>
    </div>
  );
}