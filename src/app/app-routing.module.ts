import { MarcaComponent } from './marca/marca.component';
import { ClienteComponent } from './cliente/cliente.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RolComponent } from './rol/rol.component';
import { DepartamentoComponent } from './departamento/departamento.component';
import { AreaComponent } from './area/area.component';
import { CondicionContractualComponent } from './condicion-contractual/condicion-contractual.component';
import { ContratoTipoComponent } from './contrato-tipo/contrato-tipo.component';
import { CargoComponent } from './cargo/cargo.component';
import { PersonalSituacionComponent } from './personal-situacion/personal-situacion.component';
import { PersonalComponent } from './personal/personal.component';
import { MenuComponent } from './menu/menu.component';
import { InicioComponent } from './inicio/inicio.component';
import { RolMenuComponent } from './rol-menu/rol-menu.component';
import { RolUsuarioComponent } from './rol-usuario/rol-usuario.component';
import { AuthGuard } from './auth.guard';
import { LoginComponent } from './login/login.component';
import { TipoServicioComponent } from './tipo-servicio/tipo-servicio.component';
import { DescansoComponent } from './descanso/descanso.component';
import { HorarioComponent } from './horario/horario.component';
import { PersonalHorarioComponent } from './personal-horario/personal-horario.component';
import { ReporteMarcacionComponent } from './reportes/reporte-marcacion/reporte-marcacion.component';
import { MarcacionComponent } from './marcacion/marcacion.component';
import { TipoActivoServicioComponent } from './tipo-activo-servicio/tipo-activo-servicio.component';
import { ActivoServicioComponent } from './activo-servicio/activo-servicio.component';
import { EditActivoComponent } from './edit-activo/edit-activo.component';
import { OrdenesServicioComponent } from './ordenes-servicio/ordenes-servicio.component';
import { UbicacionTecnicaComponent } from './ubicacion-tecnica/ubicacion-tecnica.component';
import { LaborComponent } from './labor/labor.component';
import { OrdenServicioTipoComponent } from './orden-servicio-tipo/orden-servicio-tipo.component';
import { CuentaContableComponent } from './cuenta-contable/cuenta-contable.component';
import { CuentaContableTipoComponent } from './cuenta-contable-tipo/cuenta-contable-tipo.component';
import { TerceroComponent } from './tercero/tercero.component';
import { ManttoOrdenservicioComponent } from './mantto-ordenservicio/mantto-ordenservicio.component';
import { GrupotrabajoComponent } from './grupotrabajo/grupotrabajo.component';
import { OrdentrabajoComponent } from './ordentrabajo/ordentrabajo.component';

const routes: Routes = [
  //{ path: '', redirectTo: '/home', pathMatch: 'full' },
  //{ path: 'home/:idVendedor', component: HomeComponent },
  
  //{ path: '#', pathMatch: 'full', redirectTo: '#', }, 
  { path: 'login', component: LoginComponent },
  { path: 'inicio', component: InicioComponent, canActivate: [AuthGuard]  },
  { path: '', component: InicioComponent, canActivate: [AuthGuard]  },
  //{ path: 'seguridad/rol', component: RolComponent },
  { path: 'seguridad/rol', component: RolComponent, canActivate: [AuthGuard] },
  { path: 'seguridad/rolMenu', component: RolMenuComponent, canActivate: [AuthGuard]  },
  { path: 'seguridad/rolUsuario', component: RolUsuarioComponent, canActivate: [AuthGuard]  },
  { path: 'mantenimiento/departamento', component: DepartamentoComponent, canActivate: [AuthGuard]  },
  { path: 'mantenimiento/area', component: AreaComponent, canActivate: [AuthGuard]  },
  { path: 'mantenimiento/condicionContract', component: CondicionContractualComponent, canActivate: [AuthGuard]  },
  { path: 'mantenimiento/contratoTipo', component: ContratoTipoComponent, canActivate: [AuthGuard]  },
  { path: 'mantenimiento/cargo', component: CargoComponent, canActivate: [AuthGuard]  },
  { path: 'mantenimiento/personalSituacion', component: PersonalSituacionComponent, canActivate: [AuthGuard]  },
  { path: 'mantenimiento/personal', component: PersonalComponent, canActivate: [AuthGuard]  },
  { path: 'mantenimiento/personal/personalHorario', component: PersonalHorarioComponent, canActivate: [AuthGuard]  },
  { path: 'mantenimiento/menu', component: MenuComponent, canActivate: [AuthGuard]  },
  { path: 'mantenimiento/ordenServicio/tipoServicio', component: TipoServicioComponent, canActivate: [AuthGuard]  },
  { path: 'mantenimiento/ordenServicio/clientes', component: ClienteComponent, canActivate: [AuthGuard]  },
  { path: 'mantenimiento/ordenServicio/tipoActivoServicio', component: TipoActivoServicioComponent, canActivate: [AuthGuard]  },
  { path: 'mantenimiento/ordenServicio/marcaActivoServicio', component: MarcaComponent, canActivate: [AuthGuard]  },
  { path: 'mantenimiento/ordenServicio/activo', component: ActivoServicioComponent, canActivate: [AuthGuard]  },
  { path: 'mantenimiento/ordenServicio/activo/create', component: EditActivoComponent, canActivate: [AuthGuard]  },
  { path: 'mantenimiento/ordenServicio/activo/edit/:codActivo', component: EditActivoComponent, canActivate: [AuthGuard]  },
  { path: 'mantenimiento/grupoHorario/descanso', component: DescansoComponent, canActivate: [AuthGuard]  },
  { path: 'mantenimiento/grupoHorario/horario', component: HorarioComponent, canActivate: [AuthGuard]  },
  { path: 'procesos/marcacion', component: MarcacionComponent, canActivate: [AuthGuard]  },
  { path: 'reporte/marcacion', component: ReporteMarcacionComponent, canActivate: [AuthGuard]  },
  { path: 'procesos/Servicio', component: OrdenesServicioComponent, canActivate: [AuthGuard]},
  { path: 'patrimonial/UbicacionTecnica', component: UbicacionTecnicaComponent, canActivate: [AuthGuard]},
  { path: 'mantenimiento/labor', component: LaborComponent, canActivate: [AuthGuard]},
  { path: 'mantenimiento/ordenserviciotipo', component: OrdenServicioTipoComponent, canActivate: [AuthGuard]},
  { path: 'contabilidad/cuentacontable', component: CuentaContableComponent, canActivate: [AuthGuard]},
  { path: 'contabilidad/cuentacontabletipo', component: CuentaContableTipoComponent, canActivate: [AuthGuard]},
  { path: 'finanzas/tercero', component: TerceroComponent, canActivate: [AuthGuard]},
  { path: 'mantenimiento/ordenservicio', component: ManttoOrdenservicioComponent, canActivate: [AuthGuard]},
  { path: 'recursoshumanos/grupotrabajo', component: GrupotrabajoComponent, canActivate: [AuthGuard]},
  { path: 'recursoshumanos/ordentrabajo', component: OrdentrabajoComponent, canActivate: [AuthGuard]},

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
