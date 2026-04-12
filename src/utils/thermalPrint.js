import axios from 'axios';

const PRINTER_KEY = 'thermal_printer_name';
export const getSavedPrinter = () => localStorage.getItem(PRINTER_KEY) || null;
export const savePrinter     = (n) => localStorage.setItem(PRINTER_KEY, n);
export const clearPrinter    = () => localStorage.removeItem(PRINTER_KEY);

// Impresión siempre va al backend local
const LOCAL_URL = 'http://localhost:4000/api/print';
const localApi = axios.create({ baseURL: LOCAL_URL, timeout: 5000 });

// Attach token
localApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function getAvailablePrinters() {
  try {
    const res = await localApi.get('/printers');
    return res.data;
  } catch { return []; }
}

export async function setServerPrinter(name) {
  await localApi.post('/printers/set', { name });
  savePrinter(name);
}

export async function printSaleTicket(sale) {
  try {
    await localApi.post('/sale', sale);
  } catch (err) {
    console.error('Error imprimiendo venta:', err);
    throw err;
  }
}

export async function printRepairTicket(repair) {
  try {
    await localApi.post('/repair', repair);
  } catch (err) {
    console.error('Error imprimiendo reparacion:', err);
    throw err;
  }
}