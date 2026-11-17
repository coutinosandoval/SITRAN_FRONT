import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Location } from '@angular/common';

@Component({
  selector: 'app-bitacora',
  standalone: true,
  // Importamos módulos necesarios para el formulario y la tabla
  imports: [CommonModule, FormsModule],
  templateUrl: './bitacora.html',
})
export class Bitacora implements OnInit {
  // ── Filtros de búsqueda ───────────────────────────────────────
  filtroUsuario: string = '';
  filtroModulo: string = '';
  filtroAccion: string = '';
  filtroResultado: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';

  // ── Datos ─────────────────────────────────────────────────────
  registros: any[] = [];
  modulos: string[] = [];

  // ── Autocompletar usuario ─────────────────────────────────────
  usuariosSugeridos: string[] = [];
  mostrarSugerencias: boolean = false;

  // ── Paginación ────────────────────────────────────────────────
  pagina: number = 1;
  tamano: number = 50;
  total: number = 0;

  // ── Acciones disponibles para el dropdown ────────────────────
  acciones: string[] = [];

  // ── Estado ────────────────────────────────────────────────────
  cargando: boolean = false;
  mensajeError: string = '';

  // ── URL base de la API ────────────────────────────────────────
  private apiUrl = `${environment.apiUrl}/api/bitacora`;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    // Servicio para navegar hacia atrás en el historial
    public location: Location,
  ) {}

  ngOnInit(): void {
    const hoy = new Date().toISOString().split('T')[0];
    this.filtroFechaInicio = hoy;
    this.filtroFechaFin = hoy;
    // Cargar módulos y acciones para los dropdowns
    this.cargarModulos();
    this.cargarAcciones();
    this.buscar();
  }


// Carga acciones únicas para el dropdown
cargarAcciones(): void {
  this.http.get<string[]>(`${this.apiUrl}/acciones`).subscribe({
    next: (data) => { this.acciones = data; }
  });
}

// Busca usuarios mientras el usuario escribe
buscarUsuarios(): void {
  if (!this.filtroUsuario || this.filtroUsuario.length < 2) {
    this.usuariosSugeridos  = [];
    this.mostrarSugerencias = false;
    return;
  }
  this.http.get<string[]>(
    `${this.apiUrl}/usuarios?busqueda=${this.filtroUsuario}`
  ).subscribe({
    next: (data) => {
      this.usuariosSugeridos  = data;
      this.mostrarSugerencias = data.length > 0;
    }
  });
}

// Selecciona un usuario de la lista de sugerencias
seleccionarUsuario(usuario: string): void {
  this.filtroUsuario      = usuario;
  this.mostrarSugerencias = false;
}

// Oculta sugerencias al perder el foco
ocultarSugerencias(): void {
  setTimeout(() => this.mostrarSugerencias = false, 200);
}

  // Carga la lista de módulos únicos para el dropdown de filtro
  cargarModulos(): void {
    this.http.get<string[]>(`${this.apiUrl}/modulos`).subscribe({
      next: (data) => {
        this.modulos = data;
      },
    });
  }

  // Construye los parámetros de búsqueda y consulta la API
  buscar(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.pagina = 1;
    this.cargarRegistros();
  }

  // Carga los registros de bitácora con los filtros actuales
  cargarRegistros(): void {
    this.cargando = true;

    // Construir parámetros de la petición
    let params = new HttpParams()
      .set('pagina', this.pagina.toString())
      .set('tamano', this.tamano.toString());

    if (this.filtroUsuario) params = params.set('usuario', this.filtroUsuario);
    if (this.filtroModulo) params = params.set('modulo', this.filtroModulo);
    if (this.filtroAccion) params = params.set('accion', this.filtroAccion);
    if (this.filtroResultado) params = params.set('resultado', this.filtroResultado);
    if (this.filtroFechaInicio) params = params.set('fechaInicio', this.filtroFechaInicio);
    if (this.filtroFechaFin) params = params.set('fechaFin', this.filtroFechaFin);

    // Obtener registros y total en paralelo
    this.http.get<any[]>(this.apiUrl, { params }).subscribe({
      next: (data) => {
        this.registros = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar la bitácora.';
        this.cargando = false;
      },
    });

    // Obtener total para paginación
    this.http.get<any>(`${this.apiUrl}/total`, { params }).subscribe({
      next: (data) => {
        this.total = data.total;
      },
    });
  }

  // Navega a la página anterior
  paginaAnterior(): void {
    if (this.pagina > 1) {
      this.pagina--;
      this.cargarRegistros();
    }
  }

  // Navega a la página siguiente
  paginaSiguiente(): void {
    if (this.pagina * this.tamano < this.total) {
      this.pagina++;
      this.cargarRegistros();
    }
  }

  // Limpia todos los filtros y recarga
  limpiarFiltros(): void {
    this.filtroUsuario = '';
    this.filtroModulo = '';
    this.filtroAccion = '';
    this.filtroResultado = '';
    const hoy = new Date().toISOString().split('T')[0];
    this.filtroFechaInicio = hoy;
    this.filtroFechaFin = hoy;
    this.buscar();
  }

  // Formatea la fecha para mostrar en la tabla
  formatoFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-GT');
  }

  // Retorna la clase CSS según el resultado del registro
  claseResultado(resultado: string): string {
    return resultado === 'EXITOSO' ? 'badge bg-success' : 'badge bg-danger';
  }

  // Calcula el total de páginas
  get totalPaginas(): number {
    return Math.ceil(this.total / this.tamano);
  }
}
