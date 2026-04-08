import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Truck, Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Driver } from '../lib/types';

const emptyForm = { name: '', phone: '', email: '', vehicle_type: 'bike', vehicle_number: '', is_active: true };

export default function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchDrivers = async () => {
    const res = await api.get('/drivers');
    setDrivers(res.data);
  };

  useEffect(() => { fetchDrivers(); }, []);

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (d: Driver) => {
    setEditId(d._id);
    setForm({ name: d.name, phone: d.phone, email: d.email, vehicle_type: d.vehicle_type, vehicle_number: d.vehicle_number, is_active: d.is_active });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editId) {
        await api.put(`/drivers/${editId}`, form);
        toast.success('Driver updated');
      } else {
        await api.post('/drivers', form);
        toast.success('Driver added');
      }
      setShowModal(false);
      fetchDrivers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this driver?')) return;
    try {
      await api.delete(`/drivers/${id}`);
      toast.success('Deleted');
      fetchDrivers();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
        <button className="btn-primary flex items-center gap-2" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add Driver
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drivers.map((d) => (
          <div key={d._id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                  <Truck className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold">{d.name}</p>
                  <p className="text-sm text-gray-500">{d.phone}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="p-1.5 text-gray-400 hover:text-accent" onClick={() => openEdit(d)}>
                  <Edit2 className="w-4 h-4" />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-red-500" onClick={() => handleDelete(d._id)}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
              <span className="capitalize">{d.vehicle_type}</span>
              <span>{d.vehicle_number}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className={`badge ${d.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {d.is_active ? 'Active' : 'Inactive'}
              </span>
              <span className="text-sm text-gray-500">{d.current_parcels_count} active parcels</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{editId ? 'Edit Driver' : 'Add Driver'}</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Name</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label">Vehicle Type</label>
                <select className="input" value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}>
                  <option value="bike">Bike</option>
                  <option value="van">Van</option>
                  <option value="truck">Truck</option>
                </select>
              </div>
              <div>
                <label className="label">Vehicle Number</label>
                <input className="input" value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                <label htmlFor="active" className="text-sm">Active</label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-outline flex-1" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
