// Modelos del módulo de vehículos

// Modelo principal de vehículo
export interface Vehiculo {
  anios: any;
  id: number;
  placa: string;
  numeroInventario: string;
  marca: string;
  modelo: string;
  anio: number;
  color?: string;
  idTipoVehiculo: number;
  nombreTipoVehiculo?: string;
  idTipoCombustible: number;
  nombreTipoCombustible?: string;
  idTipoTransmision: number;
  nombreTipoTransmision?: string;
  numeroChasis?: string;
  numeroVin?: string;
  tamanioMotor: number;
  capacidadTanque: number;
  rendimientoGalon: number;
  kilometraje: number;
  idSede: number;
  nombreSede?: string;
  estado: number;
  estadoDisponibilidad?: string;


}

// Modelo para crear o editar un vehículo
export interface VehiculoRequest {
  placa: string;
  numeroInventario: string;
  marca: string;
  modelo: string;
  año: number;
  color?: string;
  idTipoVehiculo: number;
  idTipoCombustible: number;
  idTipoTransmision: number;
  numeroChasis?: string;
  numeroVin?: string;
  tamañoMotor: number;
  capacidadTanque: number;
  rendimientoGalon: number;
  kilometraje: number;
  idSede: number;
}

// Modelo para lista paginada de vehículos
export interface VehiculoLista {
  vehiculos: Vehiculo[];
  totalRegistros: number;
  paginaActual: number;
  totalPaginas: number;
}

// Modelo genérico para catálogos
export interface CatalogoItem {
  id: number;
  nombre: string;
}

// Modelo para catálogos del formulario
export interface VehiculoCatalogos {
  tiposVehiculo: CatalogoItem[];
  tiposCombustible: CatalogoItem[];
  tiposTransmision: CatalogoItem[];
  sedes: CatalogoItem[];
}