export interface CatalogoItem {
  id:      number;
  nombre:  string;
  estado?: number;
}

export interface CatalogoRequest {
  tabla:  string;
  nombre: string;
}

export interface CatalogoActualizar {
  tabla:  string;
  nombre: string;
}

export interface CatalogoEstado {
  tabla:  string;
  estado: number;
}

export interface CatalogoConfig {
  tabla:       string;
  titulo:      string;
  tieneEstado: boolean;
}