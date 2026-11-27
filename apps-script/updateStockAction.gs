function updateStockAction_(data) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const itemId = Number(data.itemId);
  const stock = Number(data.stock);

  if (!Number.isInteger(itemId) || itemId <= 0) {
    return stockJson_({ ok: false, error: "Invalid item" });
  }
  if (!Number.isInteger(stock) || stock < 0) {
    return stockJson_({ ok: false, error: "Invalid stock" });
  }

  const idColumn = stockFindColumn_(sheet, ["ITEM ID", "ID"], 1);
  const stockColumn = stockFindColumn_(sheet, ["STOCK"], 4);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return stockJson_({ ok: false, error: "Item not found" });
  }

  const ids = sheet.getRange(2, idColumn, lastRow - 1, 1).getValues();
  for (let index = 0; index < ids.length; index += 1) {
    if (Number(ids[index][0]) === itemId) {
      sheet.getRange(index + 2, stockColumn).setValue(stock);
      return stockJson_({ ok: true, itemId: itemId, stock: stock });
    }
  }

  return stockJson_({ ok: false, error: "Item not found" });
}

function stockFindColumn_(sheet, names, fallback) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  for (let index = 0; index < headers.length; index += 1) {
    const header = String(headers[index]).trim().toUpperCase();
    if (names.some((name) => header.indexOf(name) !== -1)) {
      return index + 1;
    }
  }
  return fallback;
}

function stockJson_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
