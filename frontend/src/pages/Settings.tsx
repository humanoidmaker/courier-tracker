import { useEffect, useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/settings').then((r) => setSettings(r.data));
  }, []);

  const update = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value });
  };

  const save = async () => {
    setLoading(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({ key, value }));
      await api.put('/settings', updates);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'company_name', label: 'Company Name', type: 'text' },
    { key: 'company_phone', label: 'Company Phone', type: 'text' },
    { key: 'company_email', label: 'Company Email', type: 'text' },
    { key: 'company_address', label: 'Company Address', type: 'text' },
    { key: 'base_charge', label: 'Base Charge (INR)', type: 'number' },
    { key: 'per_kg_charge', label: 'Per Kg Charge (INR)', type: 'number' },
    { key: 'per_km_charge', label: 'Per Km Charge (INR)', type: 'number' },
    { key: 'sms_enabled', label: 'SMS Notifications', type: 'select', options: ['true', 'false'] },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="card space-y-4">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="label">{field.label}</label>
            {field.type === 'select' ? (
              <select
                className="input"
                value={settings[field.key] || ''}
                onChange={(e) => update(field.key, e.target.value)}
              >
                {field.options!.map((o) => (
                  <option key={o} value={o}>{o === 'true' ? 'Enabled' : 'Disabled'}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                className="input"
                value={settings[field.key] || ''}
                onChange={(e) => update(field.key, e.target.value)}
              />
            )}
          </div>
        ))}

        <button className="btn-primary flex items-center gap-2" onClick={save} disabled={loading}>
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
