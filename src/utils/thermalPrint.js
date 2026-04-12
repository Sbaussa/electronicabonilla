const PRINTER_KEY = 'thermal_printer_name';
export const getSavedPrinter = () => localStorage.getItem(PRINTER_KEY) || null;
export const savePrinter     = (n) => localStorage.setItem(PRINTER_KEY, n);
export const clearPrinter    = () => localStorage.removeItem(PRINTER_KEY);

const PRINT_URL = 'http://192.168.1.100:4000/api/print';

function headers() {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + (localStorage.getItem('token') || ''),
  };
}

export async function getAvailablePrinters() {
  try {
    const r = await fetch(PRINT_URL + '/printers', { headers: headers() });
    return await r.json();
  } catch { return []; }
}

export async function setServerPrinter(name) {
  await fetch(PRINT_URL + '/printers/set', { method: 'POST', headers: headers(), body: JSON.stringify({ name }) });
  savePrinter(name);
}

export async function printSaleTicket(sale) {
  await fetch(PRINT_URL + '/sale', { method: 'POST', headers: headers(), body: JSON.stringify(sale) });
}

export async function printRepairTicket(repair) {
  await fetch(PRINT_URL + '/repair', { method: 'POST', headers: headers(), body: JSON.stringify(repair) });
}