export const fmt = {
  currency: (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0),
  date:     (d) => d ? new Date(d).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' }) : '—',
  datetime: (d) => d ? new Date(d).toLocaleString('es-CO', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—',
  number:   (n) => new Intl.NumberFormat('es-CO').format(n || 0),
};

export const REPAIR_STATUSES = {
  recibido:            { label: 'Recibido',          color: 'muted'   },
  diagnostico:         { label: 'En diagnóstico',    color: 'warning' },
  en_reparacion:       { label: 'En reparación',     color: 'purple'  },
  esperando_repuesto:  { label: 'Esp. repuesto',     color: 'danger'  },
  listo:               { label: 'Listo',             color: 'success' },
  entregado:           { label: 'Entregado',         color: 'accent'  },
  no_repara:           { label: 'No repara',         color: 'muted'   },
  garantia:            { label: 'Garantía',          color: 'warning' },
};

export const PAYMENT_METHODS = [
  { value: 'efectivo',     label: 'Efectivo' },
  { value: 'tarjeta',      label: 'Tarjeta' },
  { value: 'transferencia',label: 'Transferencia' },
  { value: 'nequi',        label: 'Nequi' },
  { value: 'daviplata',    label: 'Daviplata' },
  { value: 'mixto',        label: 'Mixto' },
];

export const ROLES = {
  admin:     'Administrador',
  tecnico:   'Técnico',
  vendedor:  'Vendedor',
  recepcion: 'Recepción',
};
