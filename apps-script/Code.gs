const SCRIPT_KEY = "shop-2026-secret";

function doGet(e) {
  return handleAction_(e.parameter || {});
}

function doPost(e) {
  let data = e.parameter || {};
  if (e && e.postData && e.postData.contents) {
    try {
      data = JSON.parse(e.postData.contents);
    } catch (error) {
      return json_({ ok: false, error: "Invalid JSON" });
    }
  }
  return handleAction_(data);
}

function handleAction_(data) {
  if (String(data.key || "") !== SCRIPT_KEY) {
    return json_({ ok: false, error: "Invalid key" });
  }

  switch (String(data.action || "")) {
    case "available":
      return availableItems_();
    case "orders":
      return allOrders_();
    case "createOrder":
      return createOrder_(data);
    case "updateOrder":
      return updateOrder_(data);
    case "addItem":
      return addItem_(data);
    case "updateStock":
      return updateStock_(data);
    case "deleteItem":
      return deleteItem_(data);
    default:
      return json_({ ok: false, error: "Unknown action" });
  }
}

function itemsSheet_() {
  const book = SpreadsheetApp.getActive();
  return book.getSheetByName("Items") || book.getSheets()[0];
}

function ordersSheet_() {
  const book = SpreadsheetApp.getActive();
  return book.getSheetByName("Orders") || book.getSheets()[book.getSheets().length - 1];
}

function columnIndex_(headers, names, fallback) {
  for (let index = 0; index < headers.length; index += 1) {
    const header = String(headers[index] || "").trim().toUpperCase();
    for (let nameIndex = 0; nameIndex < names.length; nameIndex += 1) {
      if (header.indexOf(names[nameIndex]) !== -1) return index + 1;
    }
  }
  return fallback;
}

function itemColumns_(sheet) {
  const headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  return {
    id: columnIndex_(headers, ["ITEM ID", "ID"], 1),
    name: columnIndex_(headers, ["ITEM NAME", "NAME"], 2),
    price: columnIndex_(headers, ["PRICE", "AMOUNT"], 3),
    stock: columnIndex_(headers, ["STOCK", "AVAILABLE"], 4),
    image: columnIndex_(headers, ["IMAGE", "PHOTO", "URL"], 5),
  };
}

function orderColumns_(sheet) {
  const headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  return {
    id: columnIndex_(headers, ["ORDER ID", "ID"], 1),
    itemId: columnIndex_(headers, ["ITEM ID"], 2),
    qty: columnIndex_(headers, ["QTY", "QUANTITY"], 3),
    total: columnIndex_(headers, ["TOTAL", "AMOUNT"], 4),
    orderStatus: columnIndex_(headers, ["ORDER STATUS", "STATUS"], 5),
    paymentStatus: columnIndex_(headers, ["PAYMENT STATUS", "PAYMENT"], 6),
    items: columnIndex_(headers, ["ITEMS", "ITEM DETAILS", "ORDER ITEMS"], 0),
  };
}

function rowsFrom_(sheet, startRow) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow < startRow || lastColumn < 1) return [];
  return sheet.getRange(startRow, 1, lastRow - startRow + 1, lastColumn).getValues();
}

function toInteger_(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : NaN;
}

function nextId_(sheet, column) {
  const values = rowsFrom_(sheet, 2).map((row) => toInteger_(row[column - 1]));
  return values.reduce((max, value) => (Number.isFinite(value) && value > max ? value : max), 0) + 1;
}

function findRowByColumn_(sheet, column, id) {
  const values = rowsFrom_(sheet, 2);
  for (let index = 0; index < values.length; index += 1) {
    if (toInteger_(values[index][column - 1]) === id) return index + 2;
  }
  return -1;
}

function availableItems_() {
  const sheet = itemsSheet_();
  const columns = itemColumns_(sheet);
  const items = [];

  rowsFrom_(sheet, 2).forEach((row) => {
    const id = toInteger_(row[columns.id - 1]);
    const name = String(row[columns.name - 1] || "").trim();
    const price = Number(row[columns.price - 1]);
    if (!Number.isFinite(id) || id <= 0 || !name || !Number.isFinite(price) || price <= 0) return;
    items.push({
      id: id,
      name: name,
      price: price,
      stock: Math.max(0, toInteger_(row[columns.stock - 1]) || 0),
      image: String(row[columns.image - 1] || "").trim(),
    });
  });

  return json_({ ok: true, items: items });
}

function allOrders_() {
  const sheet = ordersSheet_();
  const columns = orderColumns_(sheet);
  const orders = [];

  rowsFrom_(sheet, 2).forEach((row) => {
    const id = toInteger_(row[columns.id - 1]);
    if (!Number.isFinite(id) || id <= 0) return;
    const itemId = toInteger_(row[columns.itemId - 1]) || 0;
    const qty = toInteger_(row[columns.qty - 1]) || 0;
    let parsedItems = [];
    if (columns.items) {
      try {
        const stored = String(row[columns.items - 1] || "");
        if (stored) parsedItems = JSON.parse(stored);
      } catch (error) {
        parsedItems = [];
      }
    }
    if (!Array.isArray(parsedItems) || !parsedItems.length) parsedItems = [{ itemId: itemId, qty: qty }];
    orders.push({
      id: id,
      itemId: itemId,
      qty: qty,
      total: Number(row[columns.total - 1]) || 0,
      orderStatus: String(row[columns.orderStatus - 1] || "PENDING").trim() || "PENDING",
      paymentStatus: String(row[columns.paymentStatus - 1] || "PENDING").trim() || "PENDING",
      items: parsedItems
        .map((line) => ({
          itemId: toInteger_(line && line.itemId),
          qty: toInteger_(line && line.qty),
          name: String((line && line.name) || "").trim(),
          price: Number((line && line.price) || 0) || 0,
        }))
        .filter((line) => Number.isFinite(line.itemId) && line.itemId > 0 && Number.isFinite(line.qty) && line.qty > 0),
    });
  });

  return json_({ ok: true, orders: orders });
}

function createOrder_(data) {
  const rawLines = Array.isArray(data.items) && data.items.length ? data.items : [{ itemId: data.itemId, qty: data.qty }];
  const wanted = [];

  for (let index = 0; index < rawLines.length; index += 1) {
    const itemId = toInteger_(rawLines[index] && rawLines[index].itemId);
    const qty = toInteger_(rawLines[index] && rawLines[index].qty);
    if (!Number.isFinite(itemId) || itemId <= 0) return json_({ ok: false, error: "Invalid item" });
    if (!Number.isFinite(qty) || qty <= 0) return json_({ ok: false, error: "Invalid quantity" });
    const existing = wanted.find((line) => line.itemId === itemId);
    if (existing) existing.qty += qty;
    else wanted.push({ itemId: itemId, qty: qty });
  }

  if (!wanted.length) return json_({ ok: false, error: "Invalid items" });

  const itemSheet = itemsSheet_();
  const itemCols = itemColumns_(itemSheet);
  const lines = [];

  for (let index = 0; index < wanted.length; index += 1) {
    const rowNumber = findRowByColumn_(itemSheet, itemCols.id, wanted[index].itemId);
    if (rowNumber === -1) return json_({ ok: false, error: "Item not found" });
    const stock = toInteger_(itemSheet.getRange(rowNumber, itemCols.stock).getValue()) || 0;
    if (stock < wanted[index].qty) return json_({ ok: false, error: "Not enough stock" });
    lines.push({
      itemId: wanted[index].itemId,
      qty: wanted[index].qty,
      name: String(itemSheet.getRange(rowNumber, itemCols.name).getValue() || "").trim(),
      price: Number(itemSheet.getRange(rowNumber, itemCols.price).getValue()) || 0,
      rowNumber: rowNumber,
      stock: stock,
    });
  }

  let total = 0;
  lines.forEach((line) => {
    total += line.price * line.qty;
    itemSheet.getRange(line.rowNumber, itemCols.stock).setValue(line.stock - line.qty);
  });

  const sheet = ordersSheet_();
  const columns = orderColumns_(sheet);
  const itemsColumn = columns.items || 7;
  if (!columns.items) sheet.getRange(1, itemsColumn).setValue("Items");
  const orderItems = lines.map((line) => ({
    itemId: line.itemId,
    qty: line.qty,
    name: line.name,
    price: line.price,
  }));
  const orderId = nextId_(sheet, columns.id);
  const row = sheet.getLastRow() + 1;
  sheet.getRange(row, columns.id).setValue(orderId);
  sheet.getRange(row, columns.itemId).setValue(lines[0].itemId);
  sheet.getRange(row, columns.qty).setValue(lines.reduce((sum, line) => sum + line.qty, 0));
  sheet.getRange(row, columns.total).setValue(total);
  sheet.getRange(row, columns.orderStatus).setValue("PENDING");
  sheet.getRange(row, columns.paymentStatus).setValue("PENDING");
  sheet.getRange(row, itemsColumn).setValue(JSON.stringify(orderItems));

  return json_({ ok: true, orderId: orderId, total: total, items: orderItems, orderStatus: "PENDING", paymentStatus: "PENDING" });
}

function updateOrder_(data) {
  const orderId = toInteger_(data.orderId);
  if (!Number.isFinite(orderId) || orderId <= 0) return json_({ ok: false, error: "Invalid order" });

  const sheet = ordersSheet_();
  const columns = orderColumns_(sheet);
  const rowNumber = findRowByColumn_(sheet, columns.id, orderId);
  if (rowNumber === -1) return json_({ ok: false, error: "Order not found" });

  if (data.orderStatus) sheet.getRange(rowNumber, columns.orderStatus).setValue(String(data.orderStatus).trim());
  if (data.paymentStatus) sheet.getRange(rowNumber, columns.paymentStatus).setValue(String(data.paymentStatus).trim());

  return json_({ ok: true, orderId: orderId });
}

function addItem_(data) {
  const name = String(data.name || "").trim();
  const price = Number(data.price);
  const stock = toInteger_(data.stock);
  const image = String(data.image || "").trim();
  if (!name) return json_({ ok: false, error: "Invalid name" });
  if (!Number.isFinite(price) || price <= 0) return json_({ ok: false, error: "Invalid price" });
  if (!Number.isFinite(stock) || stock < 0) return json_({ ok: false, error: "Invalid stock" });

  const sheet = itemsSheet_();
  const columns = itemColumns_(sheet);
  const itemId = nextId_(sheet, columns.id);
  const row = sheet.getLastRow() + 1;
  sheet.getRange(row, columns.id).setValue(itemId);
  sheet.getRange(row, columns.name).setValue(name);
  sheet.getRange(row, columns.price).setValue(price);
  sheet.getRange(row, columns.stock).setValue(stock);
  sheet.getRange(row, columns.image).setValue(image);

  return json_({ ok: true, itemId: itemId });
}

function updateStock_(data) {
  const itemId = toInteger_(data.itemId);
  const stock = toInteger_(data.stock);
  if (!Number.isFinite(itemId) || itemId <= 0) return json_({ ok: false, error: "Invalid item" });
  if (!Number.isFinite(stock) || stock < 0) return json_({ ok: false, error: "Invalid stock" });

  const sheet = itemsSheet_();
  const columns = itemColumns_(sheet);
  const rowNumber = findRowByColumn_(sheet, columns.id, itemId);
  if (rowNumber === -1) return json_({ ok: false, error: "Item not found" });

  sheet.getRange(rowNumber, columns.stock).setValue(stock);
  return json_({ ok: true, itemId: itemId, stock: stock });
}

function deleteItem_(data) {
  const itemId = toInteger_(data.itemId);
  if (!Number.isFinite(itemId) || itemId <= 0) return json_({ ok: false, error: "Invalid item" });

  const sheet = itemsSheet_();
  const columns = itemColumns_(sheet);
  const rowNumber = findRowByColumn_(sheet, columns.id, itemId);
  if (rowNumber === -1) return json_({ ok: false, error: "Item not found" });

  sheet.deleteRow(rowNumber);
  return json_({ ok: true, itemId: itemId });
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
