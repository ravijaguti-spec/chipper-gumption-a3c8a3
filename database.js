const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
}

function apiUrl(path = '') {
  return `${(SUPABASE_URL || '').replace(/\/$/, '')}/rest/v1/${path}`;
}

async function supabaseRequest(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase environment variables are not configured');
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) {
    const message = body?.message || body?.hint || body?.details || body?.error || text || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return body;
}

function normalizeOrder(order) {
  return {
    id: order.id,
    customer: order.customer,
    vendorName: order.vendorName || '',
    designNo: order.designNo ?? null,
    jobNo: order.jobNo ?? null,
    itemType: order.itemType ?? null,
    weight: order.weight ?? null,
    size: order.size ?? null,
    metalKT: order.metalKT ?? null,
    rhodiumColor: order.rhodiumColor ?? null,
    diamondDetails: order.diamondDetails ?? null,
    colorStoneDetails: order.colorStoneDetails ?? null,
    quantity: Number.isFinite(Number(order.quantity)) ? Number(order.quantity) : 1,
    orderDate: order.orderDate ?? null,
    deliveryDate: order.deliveryDate ?? null,
    status: order.status || 'Order place to factory',
    priority: order.priority || 'Normal',
    image: order.image ?? null,
    history: Array.isArray(order.history) ? order.history : [],
    notes: Array.isArray(order.notes) ? order.notes : [],
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function dbRowToOrder(row) {
  if (!row) return null;
  return {
    ...row,
    vendorName: row.vendorName ?? row.vendor_name ?? '',
    designNo: row.designNo ?? row.design_no ?? null,
    jobNo: row.jobNo ?? row.job_no ?? null,
    itemType: row.itemType ?? row.item_type ?? null,
    metalKT: row.metalKT ?? row.metal_kt ?? null,
    rhodiumColor: row.rhodiumColor ?? row.rhodium_color ?? null,
    diamondDetails: row.diamondDetails ?? row.diamond_details ?? null,
    colorStoneDetails: row.colorStoneDetails ?? row.color_stone_details ?? null,
    orderDate: row.orderDate ?? row.order_date ?? null,
    deliveryDate: row.deliveryDate ?? row.delivery_date ?? null,
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
    history: Array.isArray(row.history) ? row.history : [],
    notes: Array.isArray(row.notes) ? row.notes : []
  };
}

async function getAllOrders() {
  const data = await supabaseRequest('orders?select=*&order=createdAt.desc');
  return (data || []).map(dbRowToOrder);
}

async function getOrderById(id) {
  const data = await supabaseRequest(`orders?select=*&id=eq.${encodeURIComponent(id)}&limit=1`);
  return dbRowToOrder(data?.[0]);
}

async function createOrder(order) {
  const normalized = normalizeOrder(order);
  const data = await supabaseRequest('orders', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(normalized)
  });
  return dbRowToOrder(data?.[0]);
}

async function updateOrder(id, order) {
  const existing = await getOrderById(id);
  if (!existing) return null;
  const merged = normalizeOrder({ ...existing, ...order, id });
  delete merged.createdAt;
  const data = await supabaseRequest(`orders?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(merged)
  });
  return dbRowToOrder(data?.[0]);
}

async function deleteOrder(id) {
  const data = await supabaseRequest(`orders?id=eq.${encodeURIComponent(id)}&select=id`, {
    method: 'DELETE',
    headers: { Prefer: 'return=representation' }
  });
  return Array.isArray(data) && data.length > 0;
}

async function importOrders(orders) {
  const valid = orders.filter(o => o && o.id && o.customer).map(normalizeOrder);
  await supabaseRequest('orders?id=neq.__ELITORR_IMPORT_SENTINEL__', { method: 'DELETE' });
  if (!valid.length) return 0;
  await supabaseRequest('orders', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(valid)
  });
  return valid.length;
}

module.exports = { getAllOrders, getOrderById, createOrder, updateOrder, deleteOrder, importOrders };
