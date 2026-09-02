// ============================================================
// solicitud-combustible.ts
// Componente para gestión de solicitudes de combustible
// Flujo: Solicitante crea → Jefe autoriza/entrega → Piloto devuelve
// Ruta: src/app/cupones/solicitud-combustible/solicitud-combustible.ts
// ============================================================

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../servicios/auth.service';
import { CuponService } from '../../servicios/cupon.service';
import { ComisionService } from '../../servicios/comision.service';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ModalComponent } from '../../shared/modal/modal';

@Component({
  selector: 'app-solicitud-combustible',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './solicitud-combustible.html',
})
export class SolicitudCombustibleComponent implements OnInit {
  // ─── Listas ───
  solicitudes: any[] = [];
  vehiculos: any[] = [];
  pilotos: any[] = [];
  cuponesDisponibles: any[] = [];
  detalleSolicitud: any[] = [];
  // Niveles de tanque disponibles
  readonly nivelesTanque = ['1/4', '1/2', '3/4', 'Full'];

  // ─── Paginación ───
  paginaActual: number = 1;
  tamanioPagina: number = 10;
  totalRegistros: number = 0;
  totalPaginas: number = 0;
  filtroEstado: string = '';

  // ── Modal ─────────────────────────────────────────────────
  modalVisible: boolean = false;
  modalTitulo: string = '';
  modalMensaje: string = '';
  modalTipo: 'confirmar' | 'peligro' | 'devolucion' | 'info' = 'confirmar';
  modalBtnAceptar: string = 'Confirmar';
  modalAccion: (() => void) | null = null;

  // ─── Visibilidad ───
  mostrarLista: boolean = true;
  mostrarFormulario: boolean = false;
  mostrarDetalle: boolean = false;

  // ─── Detalle seleccionado ───
  solicitudSeleccionada: any = null;
  idSolicitudActual: number = 0;

  // ─── Cupones a agregar ───
  cuponesAgregados: any[] = [];
  rangoSeleccionado: any = null;
  cantidadAsignar: number = 0;
  cuponesDisponiblesAgrupados: any[] = [];

  // ─── Modal devolución ───
  mostrarModalDevolucion: boolean = false;
  detalleSeleccionado: any = null;
  cantidadDevolver: number = 0;

  // ─── Roles ───
  esSolicitante: boolean = false;
  esJefeTransporte: boolean = false;
  ultimoKm: number | null = null;
  idSedeUsuario: number | null = null;

  // ─── Formulario ───
  formulario: FormGroup;
  intentoGuardar: boolean = false;
  mostrarAsignacionJefe: boolean = false;

  // ─── Estado ───
  cargando: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';

  private apiUrl = `${environment.apiUrl}/api/solicitud-combustible`;

  constructor(
    private authService: AuthService,
    private cuponService: CuponService,
    private comisionService: ComisionService,
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {
    // Formulario de nueva solicitud
    this.formulario = this.fb.group({
      idVehiculo: ['', Validators.required],
      idPiloto: ['', Validators.required],
      solicitante: ['', Validators.required],
      observaciones: [''],
    });

    this.formulario = this.fb.group({
      idVehiculo: ['', Validators.required],
      idPiloto: ['', Validators.required],
      solicitante: ['', Validators.required],
      nivelTanque: ['', Validators.required],
      kilometraje: [''],
      observaciones: [''],
    });
  }

  ngOnInit(): void {
    // Determinar rol del usuario logueado
    this.esSolicitante = this.authService.tienePermiso('SOLICITAR_COMBUSTIBLE');
    this.esJefeTransporte = this.authService.tienePermiso('GESTIONAR_COMBUSTIBLE');
    this.idSedeUsuario = this.authService.obtenerIdSede();
    this.cargarSolicitudes();
    this.cargarVehiculos();
    this.cargarPilotos();
    this.cargarCuponesDisponibles();
  }

  // ─── Carga de datos ──────────────────────────────────────

  /** Carga lista de solicitudes filtradas por sede y estado */
  cargarSolicitudes(): void {
    this.cargando = true;
    let params = new HttpParams()
      .set('pagina', this.paginaActual.toString())
      .set('porPagina', this.tamanioPagina.toString());

    if (this.idSedeUsuario) params = params.set('idSede', this.idSedeUsuario.toString());
    if (this.filtroEstado) params = params.set('estado', this.filtroEstado);

    this.http.get<any>(this.apiUrl, { params }).subscribe({
      next: (data) => {
        this.solicitudes = data.datos;
        this.totalRegistros = data.total;
        this.totalPaginas = Math.ceil(data.total / this.tamanioPagina);
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar solicitudes.';
        this.cargando = false;
      },
    });
  }

  /** Al seleccionar piloto, autocompleta el campo solicitante */
  onPilotoSeleccionado(idPiloto: any): void {
    const piloto = this.pilotos.find((p: any) => p.id == idPiloto);
    if (piloto) {
      this.formulario.patchValue({ solicitante: piloto.nombre });
      this.cdr.detectChanges();
    }
  }

  /** Confirma asignación del Jefe de Transportes — usa rangos individuales */
  confirmarAsignacionJefe(): void {
    if (this.cuponesAgregados.length === 0) {
      this.mensajeError = 'Debe agregar al menos un cupón.';
      return;
    }
    this.modalTitulo = 'Confirmar Entrega';
    this.modalMensaje = '¿Confirma entregar estos cupones al solicitante?';
    this.modalTipo = 'confirmar';
    this.modalBtnAceptar = 'Entregar';
    this.modalAccion = () => {
      this.cargando = true;
      this._procesarAsignacionJefe(0);
    };
    this.modalVisible = true;
  }

  /** Procesa asignaciones del Jefe de Transportes en secuencia */
  private async _procesarAsignacionJefe(index: number): Promise<void> {
    if (index >= this.cuponesAgregados.length) {
      // Autorizar la solicitud
      this.http
        .patch<any>(`${this.apiUrl}/${this.solicitudSeleccionada.id}/autorizar`, {})
        .subscribe({
          next: (res) => {
            this.cargando = false;
            this.mensajeExito = 'Cupones entregados correctamente.';
            if (res?.urlPdf) window.open(`https://localhost:7069${res.urlPdf}`, '_blank');
            this.mostrarAsignacionJefe = false;
            this.volverLista();
            this.cargarSolicitudes();
          },
          error: (err) => {
            this.mensajeError = err.error?.mensaje || 'Error al finalizar.';
            this.cargando = false;
          },
        });
      return;
    }

    const a = this.cuponesAgregados[index];
    // Obtener rangos individuales de esa denominación ordenados
    const rangosIndividuales = this.cuponesDisponibles
      .filter((r: any) => r.denominacion === a.rango.denominacion)
      .sort((x: any, y: any) => x.numeroDel - y.numeroDel);

    let pendiente = a.cantidad;

    for (const rango of rangosIndividuales) {
      if (pendiente <= 0) break;

      const totalRango = rango.numeroAl - rango.numeroDel + 1;
      const entregados = totalRango - rango.disponibles;
      const primerDisp = rango.numeroDel + entregados;
      const cantidadEsteRango = Math.min(pendiente, rango.disponibles);

      // Solo enviar si hay cupones disponibles en este rango
      if (cantidadEsteRango <= 0) continue;

      await this.http
        .post<any>(`${this.apiUrl}/${this.solicitudSeleccionada.id}/detalle`, {
          idSolCuponDet: rango.id,
          denominacion: rango.denominacion,
          cantidad: cantidadEsteRango,
          numeroDel: primerDisp,
          numeroAl: primerDisp + cantidadEsteRango - 1,
        })
        .toPromise()
        .catch((err) => {
          this.mensajeError = err.error?.mensaje || 'Error al asignar cupones.';
          this.cargando = false;
        });

      pendiente -= cantidadEsteRango;
    }

    this._procesarAsignacionJefe(index + 1);
  }

  /** Abre vista de asignación de cupones para Jefe de Transportes */
  abrirAsignacionJefe(s: any): void {
    this.solicitudSeleccionada = s;
    this.mostrarLista = false;
    this.mostrarFormulario = false;
    this.mostrarDetalle = false;
    this.mostrarAsignacionJefe = true;
    this.cuponesAgregados = [];
    this.cuponesDisponiblesAgrupados = [];
    this.rangoSeleccionado = null;
    this.cantidadAsignar = 0;
    this.limpiarMensajes();

    // Cargar inventario agrupado de la sede
    this.cuponService.obtenerInventarioSedeAgrupado(this.idSedeUsuario!).subscribe({
      next: (data) => {
        this.cuponesDisponiblesAgrupados = data.filter((g: any) => g.totalDisponibles > 0);
        this.cdr.detectChanges();
      },
    });

    // Cargar rangos individuales para calcular números
    this.cargarCuponesDisponibles();
  }

  /** Agrega cupón al listado del Jefe de Transportes con números individuales */
  agregarCuponJefe(): void {
    if (!this.rangoSeleccionado || this.cantidadAsignar <= 0) {
      this.mensajeError = 'Seleccione una denominación e ingrese una cantidad válida.';
      return;
    }
    if (this.cantidadAsignar > this.rangoSeleccionado.totalDisponibles) {
      this.mensajeError = `Solo hay ${this.rangoSeleccionado.totalDisponibles} disponibles.`;
      return;
    }

    // Calcular números individuales — secuencial del menor al mayor
    const rangosIndividuales = this.cuponesDisponibles
      .filter((r: any) => r.denominacion === this.rangoSeleccionado.denominacion)
      .sort((a: any, b: any) => a.numeroDel - b.numeroDel);

    const numerosAEntregar: number[] = [];
    let pendiente = this.cantidadAsignar;

    for (const rango of rangosIndividuales) {
      if (pendiente <= 0) break;
      // Calcular entregados y primer disponible
      const totalRango = rango.numeroAl - rango.numeroDel + 1;
      const entregados = totalRango - rango.disponibles;
      const primerDisp = rango.numeroDel + entregados;
      for (let i = primerDisp; i <= rango.numeroAl && pendiente > 0; i++) {
        numerosAEntregar.push(i);
        pendiente--;
      }
    }

    this.cuponesAgregados.push({
      rango: this.rangoSeleccionado,
      cantidad: this.cantidadAsignar,
      numeros: numerosAEntregar,
    });

    this.rangoSeleccionado = null;
    this.cantidadAsignar = 0;
    this.mensajeError = '';
    this.cdr.detectChanges();
  }

  /** Selecciona una denominación del inventario agrupado de sede */
  seleccionarDenominacionJefe(g: any): void {
    this.rangoSeleccionado = g;
    this.cantidadAsignar = 0;
    this.cdr.detectChanges();
  }
  /** Carga vehículos disponibles */
  cargarVehiculos(): void {
    const url = this.idSedeUsuario
      ? `${environment.apiUrl}/api/solicitud-combustible/vehiculos-sede?idSede=${this.idSedeUsuario}`
      : `${environment.apiUrl}/api/solicitud-combustible/vehiculos-sede`;

    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        this.vehiculos = data;
        this.cdr.detectChanges();
      },
    });
  }

  /** Carga pilotos disponibles */
  cargarPilotos(): void {
  const url = this.idSedeUsuario
    ? `${environment.apiUrl}/api/solicitud-combustible/pilotos-sede?idSede=${this.idSedeUsuario}`
    : `${environment.apiUrl}/api/solicitud-combustible/pilotos-sede`;

  this.http.get<any[]>(url).subscribe({
    next: (data) => {
      this.pilotos = data;
      this.cdr.detectChanges();
    },
  });
}

  /** Carga cupones disponibles en la sede */
  cargarCuponesDisponibles(): void {
    this.cuponService
      .obtenerTalonariosDisponibles(this.idSedeUsuario ?? undefined)
      .subscribe({ next: (data: any) => (this.cuponesDisponibles = data) });
  }

  // ─── Nueva solicitud ─────────────────────────────────────

  /** Abre el formulario de nueva solicitud */
  nuevaSolicitud(): void {
    this.mostrarLista = false;
    this.mostrarFormulario = true;
    this.mostrarDetalle = false;
    this.formulario.reset();
    this.cuponesAgregados = [];
    this.rangoSeleccionado = null;
    this.cantidadAsignar = 0;
    this.intentoGuardar = false;
    this.limpiarMensajes();
  }

  /** Guarda la nueva solicitud y sus cupones */
  guardar(): void {
    this.intentoGuardar = true;
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.cargando = true;
    const v = this.formulario.value;

    // Validar kilometraje
    const km = v.kilometraje ? Number(v.kilometraje) : null;
    if (this.ultimoKm && km && km <= this.ultimoKm) {
      this.mensajeError = `El kilometraje (${km} km) debe ser mayor al último registrado (${this.ultimoKm} km).`;
      this.cargando = false;
      return;
    }

    // Paso 1: crear la solicitud
    this.http
      .post<any>(this.apiUrl, {
        idSede: this.idSedeUsuario,
        idVehiculo: Number(v.idVehiculo),
        idPiloto: Number(v.idPiloto),
        solicitante: v.solicitante,
        nivelTanque: v.nivelTanque,
        kmActual: v.kilometraje ? Number(v.kilometraje) : null,
        observaciones: v.observaciones || null,
      })
      .subscribe({
        next: (res) => {
          this.cargando = false;
          this.mensajeExito = 'Solicitud registrada correctamente.';
          this.volverLista();
          this.cargarSolicitudes();
        },
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al registrar la solicitud.';
          this.cargando = false;
        },
      });
  }

  /** Agrega cupones uno por uno en secuencia */
  private agregarCuponesSecuencial(idSolicitud: number, index: number): void {
    if (index >= this.cuponesAgregados.length) {
      // Todos los cupones agregados
      this.cargando = false;
      this.mensajeExito = `Solicitud #${idSolicitud} registrada correctamente.`;
      this.volverLista();
      this.cargarSolicitudes();
      return;
    }

    const c = this.cuponesAgregados[index];
    this.http
      .post<any>(`${this.apiUrl}/${idSolicitud}/detalle`, {
        idSolCuponDet: c.rango.id,
        denominacion: c.rango.denominacion,
        cantidad: c.cantidad,
        numeroDel: c.rango.numeroDel,
        numeroAl: c.rango.numeroAl,
      })
      .subscribe({
        next: () => this.agregarCuponesSecuencial(idSolicitud, index + 1),
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al agregar cupones.';
          this.cargando = false;
        },
      });
  }

  // ─── Cupones ─────────────────────────────────────────────

  /** Selecciona un rango del combo */
  seleccionarRango(id: any): void {
    this.rangoSeleccionado = this.cuponesDisponibles.find((r) => r.id == id) || null;
    this.cantidadAsignar = 0;
  }

  /** Agrega un rango al listado de cupones de la solicitud */
  /** Agrega cupones con validación de disponibilidad */
  agregarCupon(): void {
    if (!this.rangoSeleccionado || this.cantidadAsignar <= 0) {
      this.mensajeError = 'Seleccione un rango e ingrese una cantidad válida.';
      return;
    }

    // Validar disponibilidad
    const disponibles = this.rangoSeleccionado.disponibles;
    if (this.cantidadAsignar > disponibles) {
      this.mensajeError = `No hay suficientes cupones. Solo hay ${disponibles} disponibles en este rango.`;
      return;
    }

    this.cuponesAgregados.push({
      rango: { ...this.rangoSeleccionado },
      cantidad: this.cantidadAsignar,
    });
    this.rangoSeleccionado = null;
    this.cantidadAsignar = 0;
    this.mensajeError = '';
    this.cdr.detectChanges();
  }

  /** Elimina un cupón de la lista antes de guardar */
  eliminarCupon(index: number): void {
    this.cuponesAgregados.splice(index, 1);
    this.cdr.detectChanges();
  }

  get totalCupones(): number {
    return this.cuponesAgregados.reduce((a, c) => a + c.cantidad, 0);
  }

  get montoTotal(): number {
    return this.cuponesAgregados.reduce((a, c) => a + c.cantidad * (c.rango.denominacion || 0), 0);
  }

  // ─── Ver detalle ─────────────────────────────────────────

  /** Carga el detalle de una solicitud */
  verDetalle(id: number): void {
    this.cargando = true;
    this.http.get<any>(`${this.apiUrl}/${id}`).subscribe({
      next: (data) => {
        this.solicitudSeleccionada = data;
        this.http.get<any[]>(`${this.apiUrl}/${id}/detalle`).subscribe({
          next: (det) => {
            this.detalleSolicitud = det;
            this.mostrarLista = false;
            this.mostrarFormulario = false;
            this.mostrarDetalle = true;
            this.cargando = false;
            this.cdr.detectChanges();
          },
        });
      },
      error: () => {
        this.mensajeError = 'Error al cargar el detalle.';
        this.cargando = false;
      },
    });
  }

  // ─── Autorizar ───────────────────────────────────────────

  /** Autoriza la solicitud y genera PDF de entrega */
  autorizar(id: number): void {
    this.modalTitulo = 'Confirmar Autorización';
    this.modalMensaje = '¿Confirma autorizar y entregar los cupones al piloto?';
    this.modalTipo = 'confirmar';
    this.modalBtnAceptar = 'Autorizar';
    this.modalAccion = () => {
      this.cargando = true;
      this.http.patch<any>(`${this.apiUrl}/${id}/autorizar`, {}).subscribe({
        next: (res) => {
          this.cargando = false;
          this.mensajeExito = 'Solicitud autorizada. Cupones entregados al piloto.';
          this.cargarSolicitudes();
          if (this.mostrarDetalle) this.verDetalle(id);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al autorizar.';
          this.cargando = false;
        },
      });
    };
    this.modalVisible = true;
  }
  // ─── Devolución ──────────────────────────────────────────

  /** Abre modal para registrar devolución */
  abrirDevolucion(det: any): void {
    this.detalleSeleccionado = det;
    this.cantidadDevolver = 0;
    this.mostrarModalDevolucion = true;
    this.limpiarMensajes();
  }

  /** Confirma la devolución de cupones */
  confirmarDevolucion(): void {
    if (this.cantidadDevolver <= 0) {
      this.mensajeError = 'Ingrese una cantidad válida.';
      return;
    }

    this.cargando = true;
    this.mostrarModalDevolucion = false;

    this.http
      .patch<any>(`${this.apiUrl}/${this.solicitudSeleccionada.id}/devolver`, {
        idDetalle: this.detalleSeleccionado.id,
        devueltos: this.cantidadDevolver,
      })
      .subscribe({
        next: () => {
          this.cargando = false;
          this.mensajeExito = 'Cupones devueltos correctamente.';
          this.verDetalle(this.solicitudSeleccionada.id);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al registrar devolución.';
          this.cargando = false;
        },
      });
  }

  // ─── Finalizar ───────────────────────────────────────────

  /** Finaliza la solicitud */
  finalizar(id: number): void {
    this.modalTitulo = 'Confirmar Finalización';
    this.modalMensaje = '¿Confirma finalizar esta solicitud?';
    this.modalTipo = 'confirmar';
    this.modalBtnAceptar = 'Finalizar';
    this.modalAccion = () => {
      this.cargando = true;
      this.http.patch<any>(`${this.apiUrl}/${id}/finalizar`, {}).subscribe({
        next: () => {
          this.cargando = false;
          this.mensajeExito = 'Solicitud finalizada correctamente.';
          this.cargarSolicitudes();
          this.volverLista();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al finalizar.';
          this.cargando = false;
        },
      });
    };
    this.modalVisible = true;
  }

  // ─── PDF ─────────────────────────────────────────────────

  /** Abre el PDF en nueva pestaña */
  verPdf(urlPdf: string): void {
    this.authService.abrirPdf(urlPdf);
  }

  // ─── Navegación ──────────────────────────────────────────

  volverLista(): void {
    this.mostrarLista = true;
    this.mostrarFormulario = false;
    this.mostrarDetalle = false;
    this.solicitudSeleccionada = null;
    this.detalleSolicitud = [];
    this.limpiarMensajes();
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.cargarSolicitudes();
  }

  filtrar(): void {
    this.paginaActual = 1;
    this.cargarSolicitudes();
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  // ─── Helpers ─────────────────────────────────────────────

  tieneError(campo: string): boolean {
    const c = this.formulario.get(campo);
    return !!(c && c.invalid && c.touched);
  }

  colorEstado(estado: string): string {
    switch (estado) {
      case 'Pendiente':
        return 'bg-warning text-dark';
      case 'Autorizada':
        return 'bg-info text-dark';
      case 'Entregada':
        return 'bg-primary';
      case 'Finalizada':
        return 'bg-success';
      case 'Cancelada':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  /** Al cambiar vehículo, carga el último km registrado */
  onVehiculoCambiado(idVehiculo: any): void {
    if (!idVehiculo) {
      this.ultimoKm = null;
      return;
    }
    this.http.get<any>(`${this.apiUrl}/ultimo-km/${idVehiculo}`).subscribe({
      next: (res) => {
        this.ultimoKm = res.ultimoKm;
        this.cdr.detectChanges();
      },
    });
  }

 onModalAceptar(evento: { texto?: string; numero?: number }): void {
  this.modalVisible = false;
  if (this.modalAccion) {
    this.modalAccion();
    this.modalAccion = null;
  }
}

  onModalCancelar(): void {
    this.modalVisible = false;
    this.modalAccion = null;
  }
}
