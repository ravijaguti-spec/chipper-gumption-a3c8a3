const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const {
  getAllOrders, getOrderById, createOrder, updateOrder, deleteOrder, importOrders
} = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(PUBLIC, { extensions: ['html'] }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/api/orders', (req, res) => { try { res.json(getAllOrders()); } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to fetch orders' }); } });
app.get('/api/orders/:id', (req, res) => { try { const o=getOrderById(req.params.id); if(!o) return res.status(404).json({error:'Order not found'}); res.json(o); } catch(e){ console.error(e); res.status(500).json({error:'Failed to fetch order'}); } });
app.post('/api/orders', (req, res) => {
  try {
    const order = { ...req.body };
    if (!order.customer || !order.vendorName) return res.status(400).json({ error: 'Customer and vendorName are required' });
    if (!order.id) order.id = 'ord_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    if (getOrderById(order.id)) return res.status(409).json({ error: 'Order ID already exists' });
    res.status(201).json(createOrder(order));
  } catch(e){ console.error(e); res.status(500).json({error:'Failed to create order'}); }
});
app.put('/api/orders/:id', (req, res) => { try { const o=updateOrder(req.params.id, req.body || {}); if(!o) return res.status(404).json({error:'Order not found'}); res.json(o); } catch(e){ console.error(e); res.status(500).json({error:'Failed to update order'}); } });
app.delete('/api/orders/:id', (req, res) => { try { if(!deleteOrder(req.params.id)) return res.status(404).json({error:'Order not found'}); res.json({success:true}); } catch(e){ console.error(e); res.status(500).json({error:'Failed to delete order'}); } });
app.get('/api/orders/export', (req, res) => { try { res.json(getAllOrders()); } catch(e){ console.error(e); res.status(500).json({error:'Failed to export orders'}); } });
app.post('/api/orders/import', (req, res) => { try { if(!Array.isArray(req.body?.orders)) return res.status(400).json({error:'Expected array of orders'}); const count=importOrders(req.body.orders); res.json({success:true, imported:count}); } catch(e){ console.error(e); res.status(500).json({error:'Failed to import orders'}); } });
app.get('*', (req, res) => res.sendFile(path.join(PUBLIC, 'index.html')));

app.listen(PORT, () => console.log(`ELITORR running on port ${PORT}`));
