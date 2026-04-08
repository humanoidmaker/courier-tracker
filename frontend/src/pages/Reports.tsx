import { useEffect, useState } from 'react';
import api from '../lib/api';
import { formatCurrency } from '../lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { Parcel, Driver } from '../lib/types';

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ef4444'];

export default function Reports() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    api.get('/parcels?limit=500').then((r) => setParcels(r.data.parcels));
    api.get('/drivers').then((r) => setDrivers(r.data));
  }, []);

  // Delivery performance by priority
  const deliveryPerf = (() => {
    const groups: Record<string, { total: number; count: number }> = {};
    parcels.filter((p) => p.status === 'delivered').forEach((p) => {
      const events = p.tracking_events;
      const booked = events.find((e) => e.status === 'booked');
      const delivered = events.find((e) => e.status === 'delivered');
      if (booked && delivered) {
        const hours = (new Date(delivered.timestamp).getTime() - new Date(booked.timestamp).getTime()) / 3600000;
        if (!groups[p.priority]) groups[p.priority] = { total: 0, count: 0 };
        groups[p.priority].total += hours;
        groups[p.priority].count += 1;
      }
    });
    return Object.entries(groups).map(([priority, data]) => ({
      priority: priority.replace('_', ' '),
      avgHours: Math.round(data.total / data.count),
    }));
  })();

  // Parcels by status
  const statusData = (() => {
    const counts: Record<string, number> = {};
    parcels.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace('_', ' '), value }));
  })();

  // Driver performance
  const driverPerf = drivers.map((d) => {
    const driverParcels = parcels.filter((p) => p.driver_id === d._id);
    const delivered = driverParcels.filter((p) => p.status === 'delivered').length;
    return { name: d.name, total: driverParcels.length, delivered };
  }).sort((a, b) => b.delivered - a.delivered);

  // Revenue by period (last 6 months)
  const revenueData = (() => {
    const months: Record<string, number> = {};
    parcels.forEach((p) => {
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = (months[key] || 0) + p.charges.total;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }));
  })();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery performance */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Avg Delivery Time by Priority</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={deliveryPerf}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" />
              <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(v: number) => `${v} hrs`} />
              <Bar dataKey="avgHours" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status distribution */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Parcels by Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label>
                {statusData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Driver performance */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Driver Performance</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={driverPerf} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="delivered" fill="#22c55e" name="Delivered" radius={[0, 4, 4, 0]} />
              <Bar dataKey="total" fill="#3b82f6" name="Total" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Revenue by Month</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
