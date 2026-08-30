const crypto = require('crypto');
const {
  getAllOrders, getOrderById, createOrder, updateOrder, deleteOrder, importOrders
} = require('../../database');

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  try {
    const method = event.httpMethod || 'GET';
    const rawPath = event.path || '/.netlify/functions/api';
    const marker = '/.netlify/functions/api';
    let route = rawPath.includes(marker) ? rawPath.split(marker)[1] || '' : rawPath.replace(/^\/api/, '');
    route = route.replace(/^\/+/, '');
    const parts = route ? route.split('/').map(decodeURIComponent) : [];

    if (method === 'OPTIONS') return json(200, { ok: true });

    if (method === 'GET' && parts[0] === 'health') {
      await getAllOrders();
      return json(200, { status: 'ok', database: 'supabase', timestamp: new Date().toISOString() });
    }

    if (method === 'GET' && parts[0] === 'orders' && parts.length === 1) return json(200, await getAllOrders());
    if (method === 'GET' && parts[0] === 'orders' && parts[1] === 'export') return json(200, await getAllOrders());

    if (method === 'GET' && parts[0] === 'orders' && parts[1]) {
      const order = await getOrderById(parts[1]);
      return order ? json(200, order) : json(404, { error: 'Order not found' });
    }

    if (method === 'POST' && parts[0] === 'orders' && parts[1] === 'import') {
      let body = {};
      try { body = event.body ? JSON.parse(event.body) : {}; } catch { return json(400, { error: 'Invalid JSON' }); }
      if (!Array.isArray(body.orders)) return json(400, { error: 'Expected array of orders' });
      return json(200, { success: true, imported: await importOrders(body.orders) });
    }

    if (method === 'POST' && parts[0] === 'orders' && parts.length === 1) {
      let order;
      try { order = event.body ? JSON.parse(event.body) : {}; } catch { return json(400, { error: 'Invalid JSON' }); }
      if (!order.customer || !order.vendorName) return json(400, { error: 'Customer and vendorName are required' });
      if (!order.id) order.id = 'ord_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
      if (await getOrderById(order.id)) return json(409, { error: 'Order ID already exists' });
      return json(201, await createOrder(order));
    }

    if (method === 'PUT' && parts[0] === 'orders' && parts[1]) {
      let body = {};
      try { body = event.body ? JSON.parse(event.body) : {}; } catch { return json(400, { error: 'Invalid JSON' }); }
      const order = await updateOrder(parts[1], body);
      return order ? json(200, order) : json(404, { error: 'Order not found' });
    }

    if (method === 'DELETE' && parts[0] === 'orders' && parts[1]) {
      const deleted = await deleteOrder(parts[1]);
      return deleted ? json(200, { success: true }) : json(404, { error: 'Order not found' });
    }

    return json(404, { error: 'API route not found' });
  } catch (e) {
    console.error(e);
    return json(500, { error: 'Server error', details: e.message });
  }
};
