import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SeguridadService } from '../servicios/seguridad.service';
import {
  Usuario,
  UsuarioCrear,
  UsuarioActualizar,
  Rol,
  RolCrear,
  Permiso,
} from '../modelos/seguridad.model';
import { CatalogoItem } from '../modelos/vehiculo.model';
import { CatalogoService } from '../servicios/catalogo.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-seguridad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seguridad.html',
})
export class SeguridadComponent implements OnInit {
  // ─── Tab activo ───
  tabActivo: string = 'usuarios';

  // ─── Usuarios ───
  usuarios: Usuario[] = [];
  // unidades: CatalogoItem[] = [];
  paginaUsuarios: number = 1;
  totalUsuarios: number = 0;
  totalPaginasUsuarios: number = 0;
  filtroEstado: string = 'Activo';
  filtroBusqueda: string = '';

  intentoGuardar: boolean = false;

  // ─── Roles y permisos ───
  roles: Rol[] = [];
  permisos: Permiso[] = [];
  lugaresDisponibles: (CatalogoItem & { tipo: string })[] = [];
  lugaresFiltrados: (CatalogoItem & { tipo: string })[] = [];

  // Estructura de agrupación de permisos por módulo, para mostrar en el modal de permisos
  // Cada grupo tiene un título y la lista de NOMBREs de permiso que contiene
  gruposPermisos = [
    { titulo: 'Dashboard', permisos: ['VER_DASHBOARD'] },
    { titulo: 'Vehículos', permisos: ['VER_VEHICULOS', 'VER_MANTENIMIENTOS', 'VER_HISTORICO_KM'] },
    { titulo: 'Pilotos', permisos: ['VER_PILOTOS'] },
    {
      titulo: 'Cupones',
      permisos: [
        'VER_TALONARIOS',
        'VER_SOLICITUDES',
        'SOLICITAR_CUPONES',
        'GESTIONAR_SOLICITUDES_CUPONES',
        'GESTIONAR_COMPRAS_TALONARIOS',
        'AUTORIZAR_SOLICITUDES_CUPONES',
      ],
    },
    { titulo: 'Comisiones', permisos: ['VER_COMISIONES', 'GESTIONAR_COMISIONES_SEDE'] },
    { titulo: 'Facturas', permisos: ['VER_FACTURAS'] },
    {
      titulo: 'Reportes',
      permisos: [
        'VER_REPORTES_VEHICULOS',
        'VER_REPORTES_PILOTOS',
        'VER_REPORTES_COMISIONES',
        'VER_REPORTES_CUPONES',
      ],
    },
    { titulo: 'Catálogos', permisos: ['VER_CATALOGOS'] },
    { titulo: 'Reportes IA', permisos: ['VER_REPORTES_IA'] },
    { titulo: 'Seguridad', permisos: ['VER_SEGURIDAD_USUARIOS', 'VER_SEGURIDAD_ROLES'] },
  ];

  // ─── Catálogos ───
  unidades: CatalogoItem[] = [];
  textoBusquedaLugar: string = '';

  // ─── Modales ───
  mostrarModalUsuario: boolean = false;
  mostrarModalRolesUsuario: boolean = false;
  mostrarModalRol: boolean = false;
  mostrarModalPermisosRol: boolean = false;
  mostrarDropdown: boolean = false;

  // ─── Seleccionados ───
  usuarioSeleccionado: Usuario | null = null;
  usuarioEditando: Usuario | null = null;
  rolSeleccionado: Rol | null = null;

  // ─── Roles/Permisos del seleccionado ───
  rolesUsuario: Rol[] = [];
  permisosRol: Permiso[] = [];

  // ─── Selección para asignar ───
  idRolSeleccionado: number = 0;
  // idPermisoSeleccionado: number = 0;

  // ─── Formularios ───
  formUsuario: UsuarioCrear & UsuarioActualizar = {
    nombre: '',
    usuario: '',
    correo: '',
    clave: '',
    estado: 'Activo',
    idUnidad: undefined,
    idSede: undefined,
  };
  formRol: RolCrear = { nombre: '', descripcion: '' };

  // ─── Estado ───
  cargando: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';

  constructor(
    private seguridadService: SeguridadService,
    private catalogoService: CatalogoService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (this.router.url.includes('roles')) {
      this.tabActivo = 'roles';
    } else {
      this.tabActivo = 'usuarios';
    }
    this.cargarUsuarios();
    this.cargarRoles();
    this.cargarPermisos();
    this.cargarUnidades();
  }

  // Carga unidades para el formulario de usuario
  cargarUnidades(): void {
    this.catalogoService.obtenerSedes().subscribe({
      next: (sedes) => {
        this.lugaresDisponibles = sedes.map((s) => ({ ...s, tipo: 'Sede' }));
      },
    });
    this.catalogoService.obtenerUnidades().subscribe({
      next: (data) => (this.unidades = data),
    });
  }
  // ─── Tab ───

  cambiarTab(tab: string): void {
    this.tabActivo = tab;
    this.limpiarMensajes();
  }

  // ─── Usuarios ───

  cargarUsuarios(): void {
    this.cargando = true;
    this.seguridadService
      .obtenerUsuarios(
        this.paginaUsuarios,
        10,
        this.filtroEstado || undefined,
        this.filtroBusqueda || undefined,
      )
      .subscribe({
        next: (data) => {
          console.log('Primer usuario:', JSON.stringify(data.usuarios[0]));
          this.usuarios = [...data.usuarios];
          this.usuarios = data.usuarios;
          this.totalUsuarios = data.totalRegistros;
          this.totalPaginasUsuarios = data.totalPaginas;
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error usuarios:', err);
          this.mensajeError = 'Error al cargar usuarios.';
          this.cargando = false;
          this.cdr.detectChanges();
        },
      });
  }

  filtrarUsuarios(): void {
    this.paginaUsuarios = 1;
    this.cargarUsuarios();
  }

  limpiarFiltrosUsuarios(): void {
    this.filtroEstado = 'Activo';
    this.filtroBusqueda = '';
    this.filtrarUsuarios();
  }

  cambiarPaginaUsuarios(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginasUsuarios) return;
    this.paginaUsuarios = pagina;
    this.cargarUsuarios();
  }

  get paginasUsuarios(): number[] {
    return Array.from({ length: this.totalPaginasUsuarios }, (_, i) => i + 1);
  }

  abrirCrearUsuario(): void {
    this.intentoGuardar = false; // ← aquí
    this.usuarioEditando = null;

    this.usuarioEditando = null;
    this.formUsuario = {
      nombre: '',
      usuario: '',
      correo: '',
      clave: '',
      estado: 'Activo',
      idUnidad: undefined,
      idSede: undefined,
    };
    this.mostrarModalUsuario = true;
  }

  abrirEditarUsuario(u: Usuario): void {
    this.intentoGuardar = false; // ← aquí
    this.usuarioEditando = u;
    this.usuarioEditando = u;
    this.formUsuario = {
      correo: u.correo,
      estado: u.estado,
      idUnidad: u.idUnidad,
      idSede: u.idSede,
      tipoLugar: u.tipoLugar,
    };
    // Pre-llenar el buscador de sede
    const sede = this.lugaresDisponibles.find((l) => l.id === u.idSede);
    this.textoBusquedaLugar = sede?.nombre || '';
    this.mostrarDropdown = false;
    this.mostrarModalUsuario = true;
  }

  cerrarModalUsuario(): void {
    this.mostrarModalUsuario = false;
  }

  guardarUsuario(): void {
    // Validar campos obligatorios al crear
    if (!this.usuarioEditando) {
      if (!this.formUsuario.nombre) {
        this.mensajeError = 'El nombre es obligatorio.';
        return;
      }
      if (!this.formUsuario.usuario) {
        this.mensajeError = 'El usuario es obligatorio.';
        return;
      }
      if (!this.formUsuario.clave) {
        this.mensajeError = 'La clave es obligatoria.';
        return;
      }
    }

    // Validar correo
    const regexCorreo = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i;
    if (!this.formUsuario.correo || !regexCorreo.test(this.formUsuario.correo)) {
      this.mensajeError = 'Ingrese un correo electrónico válido.';
      return;
    }

    // Validar sede
    if (!this.formUsuario.idSede) {
      this.mensajeError = 'Debe seleccionar una sede.';
      return;
    }

    if (this.usuarioEditando) {
      this.seguridadService
        .actualizarUsuario(this.usuarioEditando.id, {
          correo: this.formUsuario.correo,
          estado: this.formUsuario.estado,
          idUnidad: this.formUsuario.idUnidad,
          idSede: this.formUsuario.idSede,
          tipoLugar: this.formUsuario.tipoLugar,
        })
        .subscribe({
          next: () => {
            this.mensajeExito = 'Usuario actualizado correctamente.';
            this.mostrarModalUsuario = false;
            this.cargarUsuarios();
          },
          error: () => {
            this.mensajeError = 'Error al actualizar el usuario.';
          },
        });
    } else {
      this.seguridadService.crearUsuario(this.formUsuario).subscribe({
        next: () => {
          this.mensajeExito = 'Usuario creado correctamente.';
          this.mostrarModalUsuario = false;
          this.cargarUsuarios();
        },
        error: () => {
          this.mensajeError = 'Error al crear el usuario.';
        },
      });
    }
  }

  abrirRolesUsuario(u: Usuario): void {
    this.usuarioSeleccionado = u;
    this.idRolSeleccionado = 0;
    this.seguridadService.obtenerRolesUsuario(u.id).subscribe({
      next: (data) => {
        this.rolesUsuario = data;
        this.mostrarModalRolesUsuario = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar roles del usuario.';
      },
    });
  }

  cerrarModalRolesUsuario(): void {
    this.mostrarModalRolesUsuario = false;
  }

  asignarRolUsuario(): void {
    if (!this.idRolSeleccionado || !this.usuarioSeleccionado) return;
    this.seguridadService
      .asignarRol(this.usuarioSeleccionado.id, this.idRolSeleccionado)
      .subscribe({
        next: () => {
          this.mensajeExito = 'Rol asignado correctamente.';
          this.idRolSeleccionado = 0;
          this.abrirRolesUsuario(this.usuarioSeleccionado!);
        },
        error: () => {
          this.mensajeError = 'Error al asignar rol.';
        },
      });
  }

  quitarRolUsuario(idRol: number): void {
    if (!this.usuarioSeleccionado) return;
    if (!confirm('¿Quitar este rol del usuario?')) return;
    this.seguridadService.quitarRol(this.usuarioSeleccionado.id, idRol).subscribe({
      next: () => {
        this.mensajeExito = 'Rol quitado correctamente.';
        this.abrirRolesUsuario(this.usuarioSeleccionado!);
      },
      error: () => {
        this.mensajeError = 'Error al quitar rol.';
      },
    });
  }

  // ─── Roles ───

  cargarRoles(): void {
    this.seguridadService.obtenerRoles().subscribe({
      next: (data) => {
        this.roles = data;
        this.cdr.detectChanges();
      },
    });
  }

  abrirCrearRol(): void {
    this.formRol = { nombre: '', descripcion: '' };
    this.mostrarModalRol = true;
  }

  cerrarModalRol(): void {
    this.mostrarModalRol = false;
  }

  guardarRol(): void {
    this.formRol.nombre = (this.formRol.nombre ?? '').toUpperCase();
    this.seguridadService.crearRol(this.formRol).subscribe({
      next: () => {
        this.mensajeExito = 'Rol creado correctamente.';
        this.mostrarModalRol = false;
        this.cargarRoles();
        this.cdr.detectChanges(); // Forzar actualización de vista
      },
      error: () => {
        this.mensajeError = 'Error al crear el rol.';
      },
    });
  }

  abrirPermisosRol(r: Rol): void {
    this.rolSeleccionado = r;
    //this.idPermisoSeleccionado = 0;
    this.seguridadService.obtenerPermisosRol(r.id).subscribe({
      next: (data) => {
        this.permisosRol = data;
        this.mostrarModalPermisosRol = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar permisos del rol.';
      },
    });
  }

  cerrarModalPermisosRol(): void {
    this.mostrarModalPermisosRol = false;
  }

  // Asigna un permiso directo al rol (usado por checkboxes)
  asignarPermisoARol(idPermiso: number): void {
    if (!this.rolSeleccionado) return;
    this.seguridadService.asignarPermiso(this.rolSeleccionado.id, idPermiso).subscribe({
      next: () => {
        this.mensajeExito = 'Permiso asignado correctamente.';
        this.abrirPermisosRol(this.rolSeleccionado!);
      },
      error: () => {
        this.mensajeError = 'Error al asignar permiso.';
      },
    });
  }

  quitarPermisoRol(idPermiso: number): void {
    if (!this.rolSeleccionado) return;
    if (!confirm('¿Quitar este permiso del rol?')) return;
    this.seguridadService.quitarPermiso(this.rolSeleccionado.id, idPermiso).subscribe({
      next: () => {
        this.mensajeExito = 'Permiso quitado correctamente.';
        this.abrirPermisosRol(this.rolSeleccionado!);
      },
      error: () => {
        this.mensajeError = 'Error al quitar permiso.';
      },
    });
  }

  // Verifica si un permiso ya está asignado al rol actual
  tienePermisoAsignado(idPermiso: number): boolean {
    return this.permisosRol.some((p) => p.id === idPermiso);
  }

  // Toggle de permiso: asigna si no lo tiene, quita si ya lo tiene
  togglePermiso(idPermiso: number): void {
    if (this.tienePermisoAsignado(idPermiso)) {
      this.quitarPermisoRol(idPermiso);
    } else {
      this.asignarPermisoARol(idPermiso);
    }
  }

  // ─── Permisos ───

  cargarPermisos(): void {
    this.seguridadService.obtenerPermisos().subscribe({ next: (data) => (this.permisos = data) });
  }

  // ─── Utilidades ───

  limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  filtrarLugares(): void {
    const texto = this.textoBusquedaLugar.toLowerCase();
    this.lugaresFiltrados = this.lugaresDisponibles.filter((l) =>
      l.nombre.toLowerCase().includes(texto),
    );
    this.mostrarDropdown = true;
  }

  seleccionarLugar(lugar: CatalogoItem & { tipo: string }): void {
    this.formUsuario = {
      ...this.formUsuario,
      idSede: lugar.id,
      tipoLugar: 'SEDE',
    };
    this.textoBusquedaLugar = lugar.nombre;
    this.mostrarDropdown = false;
  }
  limpiarLugar(): void {
    this.formUsuario.idSede = undefined;
    this.textoBusquedaLugar = '';
    this.mostrarDropdown = false;
  }

  // Obtiene los objetos Permiso completos que pertenecen a un grupo, en el orden del catálogo
  permisosDeGrupo(nombres: string[]): Permiso[] {
    return this.permisos.filter((p) => nombres.includes(p.nombre!));
  }
  inactivarUsuario(u: Usuario): void {
    if (!confirm(`¿Confirma inactivar al usuario ${u.nombreUsuario}?`)) return;
    this.seguridadService
      .actualizarUsuario(u.id, {
        correo: u.correo,
        estado: 'Inactivo',
        idUnidad: u.idUnidad,
        idSede: u.idSede,
        tipoLugar: u.tipoLugar,
      })
      .subscribe({
        next: () => {
          this.mensajeExito = `Usuario ${u.nombreUsuario} inactivado.`;
          this.cargarUsuarios();
        },
        error: () => {
          this.mensajeError = 'Error al inactivar el usuario.';
        },
      });
  }

  activarUsuario(u: Usuario): void {
    if (!confirm(`¿Confirma activar al usuario ${u.nombreUsuario}?`)) return;
    this.seguridadService
      .actualizarUsuario(u.id, {
        correo: u.correo,
        estado: 'Activo',
        idUnidad: u.idUnidad,
        idSede: u.idSede,
        tipoLugar: u.tipoLugar,
      })
      .subscribe({
        next: () => {
          this.mensajeExito = `Usuario ${u.nombreUsuario} activado.`;
          this.cargarUsuarios();
        },
        error: () => {
          this.mensajeError = 'Error al activar el usuario.';
        },
      });
  }

  formularioInvalido(): boolean {
    if (this.usuarioEditando) {
      return !this.formUsuario.correo || !this.formUsuario.idSede;
    }
    return (
      !this.formUsuario.nombre ||
      !this.formUsuario.usuario ||
      !this.formUsuario.correo ||
      !this.formUsuario.clave ||
      !this.formUsuario.idSede
    );
  }

  esCorreoValido(correo: string): boolean {
    const regex = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i;
    return regex.test(correo);
  }

  inactivarRol(r: Rol): void {
    if (!confirm(`¿Confirma inactivar el rol "${r.nombre}"?`)) return;
    this.seguridadService.inactivarRol(r.id).subscribe({
      next: () => {
        this.mensajeExito = `Rol "${r.nombre}" inactivado correctamente.`;
        this.cargarRoles();
      },
      error: () => {
        this.mensajeError = 'Error al inactivar el rol.';
      },
    });
  }
}
