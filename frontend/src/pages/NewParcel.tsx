import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { formatCurrency } from '../lib/utils';
import toast from 'react-hot-toast';
import { Package, CheckCircle2, Copy } from 'lucide-react';

interface FormData {
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  weight_kg: string;
  description: string;
  priority: string;
  distance_km: string;
}

export default function NewParcel() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [charges, setCharges] = useState<any>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    sender_name: '', sender_phone: '', sender_address: '',
    receiver_name: '', receiver_phone: '', receiver_address: '',
    weight_kg: '', description: '', priority: 'standard', distance_km: '10',
  });

  const update = (field: keyof FormData, value: string) => setForm({ ...form, [field]: value });

  const calculateCharges = async () => {
    try {
      const res = await api.post('/charges/calculate', {
        weight_kg: parseFloat(form.weight_kg),
        priority: form.priority,
        distance_km: parseFloat(form.distance_km),
      });
      setCharges(res.data);
      setStep(3);
    } catch {
      toast.error('Failed to calculate charges');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.post('/parcels', {
        sender: { name: form.sender_name, phone: form.sender_phone, address: form.sender_address },
        receiver: { name: form.receiver_name, phone: form.receiver_phone, address: form.receiver_address },
        weight_kg: parseFloat(form.weight_kg),
        description: form.description,
        priority: form.priority,
        distance_km: parseFloat(form.distance_km),
      });
      setTrackingNumber(res.data.tracking_number);
      setStep(4);
      toast.success('Parcel booked!');
    } catch {
      toast.error('Failed to create parcel');
    } finally {
      setLoading(false);
    }
  };

  const copyTracking = () => {
    navigator.clipboard.writeText(trackingNumber);
    toast.success('Copied!');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">New Parcel</h1>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {['Sender', 'Package', 'Review', 'Done'].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-accent text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className="text-sm text-gray-500 hidden sm:inline">{label}</span>
            {i < 3 && <div className="w-8 h-px bg-gray-300" />}
          </div>
        ))}
      </div>

      {/* Step 1: Sender & Receiver */}
      {step === 1 && (
        <div className="card space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-3">Sender Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Name</label>
                <input className="input" value={form.sender_name} onChange={(e) => update('sender_name', e.target.value)} required />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.sender_phone} onChange={(e) => update('sender_phone', e.target.value)} required />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address</label>
                <textarea className="input" rows={2} value={form.sender_address} onChange={(e) => update('sender_address', e.target.value)} required />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-3">Receiver Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Name</label>
                <input className="input" value={form.receiver_name} onChange={(e) => update('receiver_name', e.target.value)} required />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.receiver_phone} onChange={(e) => update('receiver_phone', e.target.value)} required />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address</label>
                <textarea className="input" rows={2} value={form.receiver_address} onChange={(e) => update('receiver_address', e.target.value)} required />
              </div>
            </div>
          </div>
          <button className="btn-primary" onClick={() => setStep(2)} disabled={!form.sender_name || !form.receiver_name}>
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Package details */}
      {step === 2 && (
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Package Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Weight (kg)</label>
              <input type="number" step="0.1" className="input" value={form.weight_kg} onChange={(e) => update('weight_kg', e.target.value)} required />
            </div>
            <div>
              <label className="label">Distance (km)</label>
              <input type="number" step="0.1" className="input" value={form.distance_km} onChange={(e) => update('distance_km', e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <input className="input" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="e.g. Electronics - Laptop" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Priority</label>
              <div className="grid grid-cols-3 gap-3">
                {['standard', 'express', 'same_day'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => update('priority', p)}
                    className={`p-3 rounded-lg border-2 text-center capitalize transition-colors ${
                      form.priority === p ? 'border-accent bg-accent/5 text-accent' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium">{p.replace('_', ' ')}</span>
                    <span className="block text-xs text-gray-500 mt-1">
                      {p === 'standard' ? '3-5 days' : p === 'express' ? '1-2 days' : 'Today'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn-outline" onClick={() => setStep(1)}>Back</button>
            <button className="btn-primary" onClick={calculateCharges} disabled={!form.weight_kg}>Calculate & Review</button>
          </div>
        </div>
      )}

      {/* Step 3: Review & confirm */}
      {step === 3 && charges && (
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Review & Confirm</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Sender</p>
              <p className="font-medium">{form.sender_name}</p>
              <p className="text-gray-500">{form.sender_phone}</p>
            </div>
            <div>
              <p className="text-gray-500">Receiver</p>
              <p className="font-medium">{form.receiver_name}</p>
              <p className="text-gray-500">{form.receiver_phone}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <h3 className="font-semibold text-gray-900">Charge Breakdown</h3>
            <div className="flex justify-between"><span>Base Charge</span><span>{formatCurrency(charges.base_charge)}</span></div>
            <div className="flex justify-between"><span>Weight ({form.weight_kg} kg)</span><span>{formatCurrency(charges.weight_charge)}</span></div>
            <div className="flex justify-between"><span>Distance ({form.distance_km} km)</span><span>{formatCurrency(charges.distance_charge)}</span></div>
            <div className="flex justify-between"><span>Priority Surcharge</span><span>{formatCurrency(charges.priority_surcharge)}</span></div>
            <div className="border-t pt-2 flex justify-between"><span>Subtotal</span><span>{formatCurrency(charges.subtotal)}</span></div>
            <div className="flex justify-between"><span>GST (18%)</span><span>{formatCurrency(charges.gst)}</span></div>
            <div className="border-t pt-2 flex justify-between text-base font-bold text-accent">
              <span>Total</span><span>{formatCurrency(charges.total)}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn-outline" onClick={() => setStep(2)}>Back</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Booking...' : 'Confirm & Book'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="card text-center py-10">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Parcel Booked!</h2>
          <p className="text-gray-500 mb-6">Your parcel has been booked successfully.</p>
          <div className="bg-accent/5 border-2 border-accent rounded-xl p-6 max-w-xs mx-auto">
            <p className="text-sm text-gray-500 mb-1">Tracking Number</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-2xl font-mono font-bold text-accent">{trackingNumber}</p>
              <button onClick={copyTracking} className="text-gray-400 hover:text-accent">
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex gap-3 justify-center mt-6">
            <button className="btn-outline" onClick={() => { setStep(1); setForm({ sender_name: '', sender_phone: '', sender_address: '', receiver_name: '', receiver_phone: '', receiver_address: '', weight_kg: '', description: '', priority: 'standard', distance_km: '10' }); }}>
              Book Another
            </button>
            <button className="btn-primary" onClick={() => navigate('/parcels')}>
              View Parcels
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
