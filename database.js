const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'elitorr.db');
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer TEXT NOT NULL,
    vendorName TEXT NOT NULL,
    designNo TEXT,
    jobNo TEXT,
    itemType TEXT,
    weight TEXT,
    size TEXT,
    metalKT TEXT,
    rhodiumColor TEXT,
    diamondDetails TEXT,
    colorStoneDetails TEXT,
    quantity INTEGER DEFAULT 1,
    orderDate TEXT,
    deliveryDate TEXT,
    status TEXT DEFAULT 'Order place to factory',
    priority TEXT DEFAULT 'Normal',
    image TEXT,
    history TEXT,
    notes TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

const parseJson = value => { try { return JSON.parse(value); } catch { return value; } };
const rowToOrder = row => row ? ({ ...row, history: parseJson(row.history) || [], notes: parseJson(row.notes) || [] }) : null;

function getAllOrders() {
  return db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all().map(rowToOrder);
}
function getOrderById(id) { return rowToOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(id)); }

function createOrder(order) {
  const stmt = db.prepare(`INSERT INTO orders (
    id, customer, vendorName, designNo, jobNo, itemType, weight, size, metalKT, rhodiumColor,
    diamondDetails, colorStoneDetails, quantity, orderDate, deliveryDate, status, priority, image, history, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  stmt.run(
    order.id, order.customer, order.vendorName || '', order.designNo ?? null, order.jobNo ?? null,
    order.itemType ?? null, order.weight ?? null, order.size ?? null, order.metalKT ?? null,
    order.rhodiumColor ?? null, order.diamondDetails ?? null, order.colorStoneDetails ?? null,
    Number.isFinite(Number(order.quantity)) ? Number(order.quantity) : 1, order.orderDate ?? null,
    order.deliveryDate ?? null, order.status || 'Order place to factory', order.priority || 'Normal',
    order.image ?? null, JSON.stringify(Array.isArray(order.history) ? order.history : []),
    JSON.stringify(Array.isArray(order.notes) ? order.notes : [])
  );
  return getOrderById(order.id);
}

function updateOrder(id, order) {
  const existing = getOrderById(id);
  if (!existing) return null;
  const merged = { ...existing, ...order, id };
  db.prepare(`UPDATE orders SET
    customer=?, vendorName=?, designNo=?, jobNo=?, itemType=?, weight=?, size=?, metalKT=?, rhodiumColor=?,
    diamondDetails=?, colorStoneDetails=?, quantity=?, orderDate=?, deliveryDate=?, status=?, priority=?, image=?,
    history=?, notes=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?`).run(
      merged.customer, merged.vendorName, merged.designNo ?? null, merged.jobNo ?? null, merged.itemType ?? null,
      merged.weight ?? null, merged.size ?? null, merged.metalKT ?? null, merged.rhodiumColor ?? null,
      merged.diamondDetails ?? null, merged.colorStoneDetails ?? null,
      Number.isFinite(Number(merged.quantity)) ? Number(merged.quantity) : 1,
      merged.orderDate ?? null, merged.deliveryDate ?? null, merged.status || existing.status,
      merged.priority || existing.priority, merged.image ?? null,
      JSON.stringify(Array.isArray(merged.history) ? merged.history : []),
      JSON.stringify(Array.isArray(merged.notes) ? merged.notes : []), id
    );
  return getOrderById(id);
}
function deleteOrder(id) { return db.prepare('DELETE FROM orders WHERE id = ?').run(id).changes > 0; }
function deleteAllOrders() { return db.prepare('DELETE FROM orders').run().changes; }

function importOrders(orders) {
  const tx = db.transaction(items => {
    deleteAllOrders();
    const insert = db.prepare(`INSERT INTO orders (
      id, customer, vendorName, designNo, jobNo, itemType, weight, size, metalKT, rhodiumColor,
      diamondDetails, colorStoneDetails, quantity, orderDate, deliveryDate, status, priority, image, history, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    let count = 0;
    for (const order of items) {
      if (!order || !order.id || !order.customer) continue;
      insert.run(
        order.id, order.customer, order.vendorName || '', order.designNo ?? null, order.jobNo ?? null,
        order.itemType ?? null, order.weight ?? null, order.size ?? null, order.metalKT ?? null,
        order.rhodiumColor ?? null, order.diamondDetails ?? null, order.colorStoneDetails ?? null,
        Number.isFinite(Number(order.quantity)) ? Number(order.quantity) : 1, order.orderDate ?? null,
        order.deliveryDate ?? null, order.status || 'Order place to factory', order.priority || 'Normal',
        order.image ?? null, JSON.stringify(Array.isArray(order.history) ? order.history : []),
        JSON.stringify(Array.isArray(order.notes) ? order.notes : [])
      );
      count++;
    }
    return count;
  });
  return tx(orders);
}

module.exports = { db, getAllOrders, getOrderById, createOrder, updateOrder, deleteOrder, importOrders, deleteAllOrders };
