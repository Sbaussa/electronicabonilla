const PRINTER_KEY = 'thermal_printer_name';
export const getSavedPrinter = () => localStorage.getItem(PRINTER_KEY) || null;
export const savePrinter     = (n) => localStorage.setItem(PRINTER_KEY, n);
export const clearPrinter    = () => localStorage.removeItem(PRINTER_KEY);

const LOCAL_URL = import.meta.env.VITE_LOCAL_PRINT_URL || 'http://localhost:4000';

function getToken() {
  return localStorage.getItem('token');
}

export async function getAvailablePrinters() {
  try {
    const res = await fetch(`${LOCAL_URL}/api/print/printers`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    return await res.json();
  } catch { return []; }
}

export async function setServerPrinter(name) {
  await fetch(`${LOCAL_URL}/api/print/printers/set`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ name }),
  });
  savePrinter(name);
}

export async function printSaleTicket(sale) {
  try {
    const res = await fetch(`${LOCAL_URL}/api/print/sale`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify(sale),
    });
    if (!res.ok) throw new Error('Error al imprimir');
  } catch (err) {
    console.error('Error imprimiendo venta:', err);
    throw err;
  }
}

export async function printRepairTicket(repair) {
  try {
    const res = await fetch(`${LOCAL_URL}/api/print/repair`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify(repair),
    });
    if (!res.ok) throw new Error('Error al imprimir');
  } catch (err) {
    console.error('Error imprimiendo reparacion:', err);
    throw err;
  }
}