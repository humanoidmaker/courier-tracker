import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { formatDateTime, formatCurrency, statusColor, statusLabel, priorityColor } from '../lib/utils';
import { ArrowLeft, MapPin, Clock, Truck, User } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Parcel, Driver } from '../lib/types';

export default function ParcelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [statusForm, setStatusForm] = useState({ status: '', location: '', notes: '' });
  const [podForm, setPodForm] = useState({ receiver_name: '', signature: '', photo: '' });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPodModal, setShowPodModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    api.get(`/parcels/${id}`).then((r) => setParcel(r.data));
    api.get('/drivers/available').then((r) => setDrivers(r.data));
  }, [id]);

  const updateStatus = async () => {
    try {
      await api.put(`/parcels/${id}/status`, statusForm);
      toast.success('Status updated');
      setShowStatusModal(false);
      const res = await api.get(`/parcels/${id}`);
      setParcel(res.data);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const submitPod = async () => {
    try {
      await api.put(`/parcels/${id}/pod`, podForm);
      toast.success('Proof of delivery recorded');
      setShowPodModal(false);
      const res = await api.get(`/parcels/${id}`);
      setParcel(res.data);
    } catch {
      toast.error('Failed to record POD');
    }
  };

  const assignDriver = async (driverId: string) => {
    try {
      await api.put(`/parcels/${id}/assign-driver`, { driver_id: driverId });
      toast.success('Driver assigned');
      setShowAssignModal(false);
      const res = await api.get(`/parcels/${id}`);
      setParcel(res.data);
    } catch {
      toast.error('Failed to assign driver');
    }
  };

  if (!parcel) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate('/parcels')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Parcels
      </button>

      {/* Header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Tracking Number</p>
            <p className="text-2xl font-mono font-bold text-accent">{parcel.tracking_number}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className={`badge ${statusColor(parcel.status)}`}>{statusLabel(parcel.status)}</span>
            <span className={`badge ${priorityColor(parcel.priority)} capitalize`}>{parcel.priority.replace('_', ' ')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Sender</p>
            <p className="font-medium">{parcel.sender.name}</p>
            <p className="text-sm text-gray-500">{parcel.sender.phone}</p>
            <p className="text-sm text-gray-500">{parcel.sender.address}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Receiver</p>
            <p className="font-medium">{parcel.receiver.name}</p>
            <p className="text-sm text-gray-500">{parcel.receiver.phone}</p>
            <p className="text-sm text-gray-500">{parcel.receiver.address}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Package</p>
            <p className="text-sm">{parcel.description}</p>
            <p className="text-sm text-gray-500">{parcel.weight_kg} kg | {parcel.distance_km} km</p>
            <p className="font-medium text-accent mt-1">{formatCurrency(parcel.charges.total)}</p>
          </div>
        </div>

        {parcel.driver && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
            <Truck className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium">Driver: {parcel.driver.name}</p>
              <p className="text-xs text-gray-500">{parcel.driver.phone} | {parcel.driver.vehicle_number}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-4">
          {parcel.status !== 'delivered' && parcel.status !== 'returned' && (
            <>
              <button className="btn-primary text-sm" onClick={() => setShowStatusModal(true)}>Update Status</button>
              <button className="btn-secondary text-sm" onClick={() => setShowAssignModal(true)}>Assign Driver</button>
            </>
          )}
          {parcel.status === 'delivered' && !parcel.proof_of_delivery && (
            <button className="btn-primary text-sm" onClick={() => setShowPodModal(true)}>Record POD</button>
          )}
        </div>
      </div>

      {/* Charges breakdown */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Charge Breakdown</h2>
        <div className="space-y-2 text-sm max-w-sm">
          <div className="flex justify-between"><span className="text-gray-500">Base</span><span>{formatCurrency(parcel.charges.base_charge)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Weight</span><span>{formatCurrency(parcel.charges.weight_charge)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Distance</span><span>{formatCurrency(parcel.charges.distance_charge)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Priority surcharge</span><span>{formatCurrency(parcel.charges.priority_surcharge)}</span></div>
          <div className="flex justify-between border-t pt-2"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(parcel.charges.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">GST (18%)</span><span>{formatCurrency(parcel.charges.gst)}</span></div>
          <div className="flex justify-between border-t pt-2 font-bold text-accent"><span>Total</span><span>{formatCurrency(parcel.charges.total)}</span></div>
        </div>
      </div>

      {/* Tracking timeline */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Tracking Timeline</h2>
        <div className="space-y-0">
          {[...parcel.tracking_events].reverse().map((evt, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-accent' : 'bg-gray-300'}`} />
                {i < parcel.tracking_events.length - 1 && <div className="w-px h-full bg-gray-200 min-h-[40px]" />}
              </div>
              <div className="pb-6">
                <div className="flex items-center gap-2">
                  <span className={`badge ${statusColor(evt.status)}`}>{statusLabel(evt.status)}</span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDateTime(evt.timestamp)}</span>
                  {evt.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{evt.location}</span>}
                </div>
                {evt.notes && <p className="text-sm text-gray-600 mt-1">{evt.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* POD info */}
      {parcel.proof_of_delivery && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Proof of Delivery</h2>
          <p className="text-sm"><span className="text-gray-500">Received by:</span> {parcel.proof_of_delivery.receiver_name}</p>
          <p className="text-sm text-gray-500">{formatDateTime(parcel.proof_of_delivery.timestamp)}</p>
        </div>
      )}

      {/* Status update modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowStatusModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Update Status</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Status</label>
                <select className="input" value={statusForm.status} onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}>
                  <option value="">Select status</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="in_transit">In Transit</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="returned">Returned</option>
                </select>
              </div>
              <div>
                <label className="label">Location</label>
                <input className="input" value={statusForm.location} onChange={(e) => setStatusForm({ ...statusForm, location: e.target.value })} />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input" rows={2} value={statusForm.notes} onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-outline flex-1" onClick={() => setShowStatusModal(false)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={updateStatus} disabled={!statusForm.status}>Update</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign driver modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowAssignModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Assign Driver</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {drivers.map((d) => (
                <button
                  key={d._id}
                  className="w-full text-left p-3 rounded-lg border hover:border-accent hover:bg-accent/5 transition-colors"
                  onClick={() => assignDriver(d._id)}
                >
                  <p className="font-medium">{d.name}</p>
                  <p className="text-sm text-gray-500 capitalize">{d.vehicle_type} - {d.vehicle_number} | {d.current_parcels_count} parcels</p>
                </button>
              ))}
            </div>
            <button className="btn-outline w-full mt-4" onClick={() => setShowAssignModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* POD modal */}
      {showPodModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowPodModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Proof of Delivery</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Receiver Name</label>
                <input className="input" value={podForm.receiver_name} onChange={(e) => setPodForm({ ...podForm, receiver_name: e.target.value })} />
              </div>
              <div>
                <label className="label">Signature (base64)</label>
                <textarea className="input" rows={2} value={podForm.signature} onChange={(e) => setPodForm({ ...podForm, signature: e.target.value })} placeholder="Paste base64 signature..." />
              </div>
              <div>
                <label className="label">Photo (base64)</label>
                <textarea className="input" rows={2} value={podForm.photo} onChange={(e) => setPodForm({ ...podForm, photo: e.target.value })} placeholder="Paste base64 photo..." />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-outline flex-1" onClick={() => setShowPodModal(false)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={submitPod} disabled={!podForm.receiver_name}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
