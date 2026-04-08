import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { formatDateTime, statusColor, statusLabel } from '../lib/utils';
import { Package, Search, MapPin, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

export default function TrackParcel() {
  const { trackingNumber: urlTN } = useParams();
  const [trackingNumber, setTrackingNumber] = useState(urlTN || '');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const track = async (tn?: string) => {
    const num = tn || trackingNumber;
    if (!num) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/tracking/${num}`);
      setResult(res.data);
    } catch {
      setError('Parcel not found. Please check the tracking number.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlTN) track(urlTN);
  }, [urlTN]);

  const statusProgress = (status: string) => {
    const order = ['booked', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
    const idx = order.indexOf(status);
    return (
      <div className="flex items-center justify-between mt-6 mb-8">
        {order.map((s, i) => (
          <div key={s} className="flex flex-col items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              i <= idx ? 'bg-accent text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              {i <= idx ? '✓' : i + 1}
            </div>
            <p className={`text-xs mt-1 text-center ${i <= idx ? 'text-accent font-medium' : 'text-gray-400'}`}>
              {statusLabel(s)}
            </p>
            {i < order.length - 1 && (
              <div className={`absolute h-0.5 ${i < idx ? 'bg-accent' : 'bg-gray-200'}`} style={{ width: '100%' }} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-900 to-primary-800">
      <Toaster position="top-right" />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Track Your Parcel</h1>
          <p className="text-primary-300 mt-1">Enter your tracking number to get real-time updates</p>
        </div>

        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              className="w-full pl-10 pr-4 py-3 rounded-xl text-lg border-0 focus:ring-2 focus:ring-accent outline-none"
              placeholder="TRK-XXXXXXXX-XXXX"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && track()}
            />
          </div>
          <button className="btn-primary px-6 rounded-xl text-lg" onClick={() => track()} disabled={loading}>
            {loading ? '...' : 'Track'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 rounded-xl p-4 text-center">{error}</div>
        )}

        {result && (
          <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tracking Number</p>
                <p className="text-xl font-mono font-bold text-accent">{result.tracking_number}</p>
              </div>
              <span className={`badge text-sm px-3 py-1 ${statusColor(result.status)}`}>
                {statusLabel(result.status)}
              </span>
            </div>

            {statusProgress(result.status)}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-400 text-xs">From</p>
                <p className="font-medium">{result.sender_name}</p>
                <p className="text-gray-500">{result.sender_city || ''}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-400 text-xs">To</p>
                <p className="font-medium">{result.receiver_name}</p>
                <p className="text-gray-500">{result.receiver_city || ''}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Tracking Timeline</h3>
              <div className="space-y-0">
                {[...result.tracking_events].reverse().map((evt: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-accent' : 'bg-gray-300'}`} />
                      {i < result.tracking_events.length - 1 && <div className="w-px h-full bg-gray-200 min-h-[36px]" />}
                    </div>
                    <div className="pb-4">
                      <span className={`badge ${statusColor(evt.status)}`}>{statusLabel(evt.status)}</span>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDateTime(evt.timestamp)}</span>
                        {evt.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{evt.location}</span>}
                      </div>
                      {evt.notes && <p className="text-sm text-gray-600 mt-0.5">{evt.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {result.proof_of_delivery && (
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm font-medium text-green-800">Delivered - Received by {result.proof_of_delivery.receiver_name}</p>
                <p className="text-xs text-green-600">{formatDateTime(result.proof_of_delivery.timestamp)}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
