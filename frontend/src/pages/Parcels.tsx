import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { formatDateTime, formatCurrency, statusColor, statusLabel, priorityColor } from '../lib/utils';
import { Search, Package } from 'lucide-react';
import type { Parcel } from '../lib/types';

const STATUSES = ['all', 'booked', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'returned'];

export default function Parcels() {
  const navigate = useNavigate();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchParcels = async () => {
    const params: any = { page, limit: 20 };
    if (filter !== 'all') params.status = filter;
    if (search) params.q = search;
    const res = await api.get('/parcels', { params });
    setParcels(res.data.parcels);
    setTotal(res.data.total);
  };

  useEffect(() => {
    fetchParcels();
  }, [filter, page, search]);

  const statusPipeline = (status: string) => {
    const order = ['booked', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
    const idx = order.indexOf(status);
    return (
      <div className="flex items-center gap-0.5">
        {order.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 w-5 rounded-full ${i <= idx ? 'bg-accent' : 'bg-gray-200'}`}
            title={statusLabel(s)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Parcels</h1>
        <button className="btn-primary" onClick={() => navigate('/new-parcel')}>
          + New Parcel
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { setFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === s ? 'bg-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'all' ? 'All' : statusLabel(s)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search tracking # or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Tracking #</th>
                <th className="px-4 py-3 font-medium">Sender → Receiver</th>
                <th className="px-4 py-3 font-medium">Weight</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 font-medium">Charge</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {parcels.map((p) => (
                <tr
                  key={p._id}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/parcels/${p._id}`)}
                >
                  <td className="px-4 py-3 font-mono text-accent font-medium">{p.tracking_number}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{p.sender.name}</span>
                    <span className="text-gray-400 mx-1">→</span>
                    <span>{p.receiver.name}</span>
                  </td>
                  <td className="px-4 py-3">{p.weight_kg} kg</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${priorityColor(p.priority)} capitalize`}>{p.priority.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${statusColor(p.status)}`}>{statusLabel(p.status)}</span>
                  </td>
                  <td className="px-4 py-3">{statusPipeline(p.status)}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(p.charges.total)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDateTime(p.created_at)}</td>
                </tr>
              ))}
              {parcels.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    No parcels found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button className="btn-outline text-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span className="px-3 py-2 text-sm text-gray-500">Page {page} of {Math.ceil(total / 20)}</span>
          <button className="btn-outline text-sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
