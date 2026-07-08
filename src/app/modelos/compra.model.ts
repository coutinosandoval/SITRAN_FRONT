// ============================================================
// compra.model.ts — Modelos del módulo de compras
// ============================================================

/** Un rango de cupones dentro de una compra */
export interface CompraDetalle {
  id?:          number;
  idCompra?:    number;
  denominacion: number;   // 50 o 100
  numeroDel:    number;
  numeroAl:     number;
  cantidad?:    number;   // calculado: AL - DEL + 1
  disponibles?: number;
  asignados?:   number;
  idSede?:      number | null;
  sedeNombre?:  string | null;
  estado?:      string;
}

/** Encabezado de la compra con resumen */
export interface Compra {
  id?:              number;
  fechaCompra:      string;
  idExpendedor:     number;
  expendedor?:      string;
  fechaEmision:     string;
  fechaVencimiento: string;
  estado?:          string;
  observaciones?:   string;
  creadoPor?:       string;
  fechaCreacion?:   string;
  totalCupones?:    number;
  totalDisponibles?: number;
  montoTotal?:      number;
  totalRangos?:     number;
  detalles?:        CompraDetalle[];
}

/** Respuesta paginada del endpoint GET /api/compras */
export interface ComprasPaginadas {
  total:     number;
  pagina:    number;
  porPagina: number;
  datos:     Compra[];
}