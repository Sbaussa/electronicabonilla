import api from '../services/api';

const PRINTER_KEY = 'thermal_printer_name';
export const getSavedPrinter = () => localStorage.getItem(PRINTER_KEY) || null;
export const savePrinter     = (n) => localStorage.setItem(PRINTER_KEY, n);
export const clearPrinter    = () => localStorage.removeItem(PRINTER_KEY);

export async function getAvailablePrinters() {
  try {
    const res = await api.get('/print/printers');
    return res.data;
  } catch { return []; }
}

export async function setServerPrinter(name) {
  await api.post('/print/printers/set', { name });
  savePrinter(name);
}

export async function printSaleTicket(sale) {
  try {
    await api.post('/print/sale', sale);
  } catch (err) {
    console.error('Error imprimiendo venta:', err);
    throw err;
  }
}

export async function printRepairTicket(repair) {
  try {
    await api.post('/print/repair', repair);
  } catch (err) {
    console.error('Error imprimiendo reparacion:', err);
    throw err;
  }
}