import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { formatDateTime, formatCurrency, statusColor, statusLabel } from '../lib/utils';
import { Package, Truck, CheckCircle2, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Parcel } from '../lib/types';

const COLORS = ['#3b82f6', '#6366f1', '#eab308', '#a855f7', '#22c55e', '#ef4444'];

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentParcels, setRecentParcels] = useState<Parcel[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);

  useEffect(() => {
    api.get('/parcels/stats').then((r) => setStats(r.data));
    api.get('/parcels?limit=10').then((r) => setRecentParcels(r.data.parcels));
    api.get('/drivers').then((r) => setDrivers(r.data));
  }, []);

  const pieData = stats
    ? Object.entries(stats.distribution).map(([name, value]) => ({
        name: statusLabel(name),
        value: value as number,
      }))
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Parcels</p>
            <p className="text-2xl font-bold">{stats?.total || 0}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
            <Truck className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">In Transit</p>
            <p className="text-2xl font-bold">{stats?.in_transit || 0}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Delivered Today</p>
            <p className="text-2xl font-bold">{stats?.delivered_today || 0}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pending Pickup</p>
            <p className="text-2xl font-bold">{stats?.pending_pickup || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie chart */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Status Distribution</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Driver utilization */}
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Driver Utilization</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Driver</th>
                  <th className="pb-2 font-medium">Vehicle</th>
                  <th className="pb-2 font-medium">Active Parcels</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr key={d._id} className="border-b last:border-0">
                    <td className="py-2.5 font-medium">{d.name}</td>
                    <td className="py-2.5 text-gray-500 capitalize">{d.vehicle_type} - {d.vehicle_number}</td>
                    <td className="py-2.5">{d.current_parcels_count}</td>
                    <td className="py-2.5">
                      <span className={`badge ${d.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {d.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent parcels */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Parcels</h2>
          <Link to="/parcels" className="text-sm text-accent hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 font-medium">Tracking #</th>
                <th className="pb-2 font-medium">Sender</th>
                <th className="pb-2 font-medium">Receiver</th>
                <th className="pb-2 font-medium">Priority</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Charge</th>
                <th className="pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentParcels.map((p) => (
                <tr key={p._id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/parcels/${p._id}`}>
                  <td className="py-2.5 font-mono text-accent font-medium">{p.tracking_number}</td>
                  <td className="py-2.5">{p.sender.name}</td>
                  <td className="py-2.5">{p.receiver.name}</td>
                  <td className="py-2.5 capitalize">{p.priority}</td>
                  <td className="py-2.5">
                    <span className={`badge ${statusColor(p.status)}`}>{statusLabel(p.status)}</span>
                  </td>
                  <td className="py-2.5">{formatCurrency(p.charges.total)}</td>
                  <td className="py-2.5 text-gray-500">{formatDateTime(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
