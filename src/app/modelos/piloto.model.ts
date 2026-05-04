// Modelos del módulo de pilotos

export interface Piloto {
  id: number;
  nombre: string;
  apellidos: string;
  dpi: string;
  nit?: string;
  correo?: string;
  direccion?: string;
  fechaNacimiento?: string;
  fechaIngreso?: string;
  idSexo: number;
  nombreSexo?: string;
  idTipoSangre: number;
  nombreTipoSangre?: string;
  noLicencia: string;
  idTipoLicencia: number;
  nombreTipoLicencia?: string;
  fechaVencimiento?: string;
  idUnidad: number;
  nombreUnidad?: string;
  estado: number;
  telefonos?: string;
}

export interface PilotoRequest {
  nombre: string;
  apellidos: string;
  dpi: string;
  nit?: string;
  correo?: string;
  direccion?: string;
  fechaNacimiento?: string;
  fechaIngreso?: string;
  idSexo: number;
  idTipoSangre: number;
  noLicencia: string;
  idTipoLicencia: number;
  fechaVencimiento?: string;
  idUnidad: number;
}

export interface PilotoLista {
  pilotos: Piloto[];
  totalRegistros: number;
  paginaActual: number;
  totalPaginas: number;
}

export interface PilotoCatalogos {
  sexos:         CatalogoItem[];
  tiposSangre:   CatalogoItem[];
  tiposLicencia: CatalogoItem[];
  unidades:      CatalogoItem[];
  tiposTelefono: CatalogoItem[];
}

export interface CatalogoItem {
  id:     number;
  nombre: string;
}

export interface Telefono {
  id:                 number;
  numero:             string;
  idTipoTelefono:     number;
  nombreTipoTelefono?: string;
}

export interface TelefonoRequest {
  numero:         string;
  idTipoTelefono: number;
}