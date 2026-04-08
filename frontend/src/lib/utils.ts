export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    booked: 'bg-blue-100 text-blue-800',
    picked_up: 'bg-indigo-100 text-indigo-800',
    in_transit: 'bg-yellow-100 text-yellow-800',
    out_for_delivery: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    returned: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    booked: 'Booked',
    picked_up: 'Picked Up',
    in_transit: 'In Transit',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    returned: 'Returned',
  };
  return labels[status] || status;
}

export function priorityColor(priority: string): string {
  const colors: Record<string, string> = {
    standard: 'bg-gray-100 text-gray-700',
    express: 'bg-orange-100 text-orange-700',
    same_day: 'bg-red-100 text-red-700',
  };
  return colors[priority] || 'bg-gray-100 text-gray-700';
}
