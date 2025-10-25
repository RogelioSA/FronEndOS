import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DxButtonModule, DxDataGridModule, DxToastModule, DxPopupModule, DxSelectBoxModule, DxDateBoxModule, DxFormModule, DxTextBoxModule, DxNumberBoxModule, DxValidatorModule, DxTabsModule, DxTabPanelModule } from 'devextreme-angular';
import { MenuBarComponent } from './menu-bar/menu-bar.component';
import { DxMenuModule, DxMenuTypes } from 'devextreme-angular/ui/menu';
import { RolComponent } from './rol/rol.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BlockUIModule } from 'ng-block-ui';
import { MenuComponent } from './menu/menu.component';
import { DepartamentoComponent } from './departamento/departamento.component';
import { AreaComponent } from './area/area.component';
import { CondicionContractualComponent } from './condicion-contractual/condicion-contractual.component';
import { ContratoTipoComponent } from './contrato-tipo/contrato-tipo.component';
import { CargoComponent } from './cargo/cargo.component';
import { PersonalComponent } from './personal/personal.component';
import { PersonalSituacionComponent } from './personal-situacion/personal-situacion.component';
import { DxTreeListModule, DxTreeListTypes } from 'devextreme-angular/ui/tree-list';
import { InicioComponent } from './inicio/inicio.component';
import { RolMenuComponent } from './rol-menu/rol-menu.component';
import { RolUsuarioComponent } from './rol-usuario/rol-usuario.component';
import { LoginComponent } from './login/login.component';
import { FormsModule } from '@angular/forms';
import { ActivoServicioComponent } from './activo-servicio/activo-servicio.component';
import { TipoServicioComponent } from './tipo-servicio/tipo-servicio.component';
import { DescansoComponent } from './descanso/descanso.component';
import { HorarioComponent } from './horario/horario.component';
import { PersonalHorarioComponent } from './personal-horario/personal-horario.component';
import { ReporteMarcacionComponent } from './reportes/reporte-marcacion/reporte-marcacion.component';
import { MarcacionComponent } from './marcacion/marcacion.component';
import { AnalogClockComponent } from './analog-clock/analog-clock.component';
import { ClienteComponent } from './cliente/cliente.component';
import { TipoActivoServicioComponent } from './tipo-activo-servicio/tipo-activo-servicio.component';
import { ParametroActivoServicioComponent } from './parametro-activo-servicio/parametro-activo-servicio.component';
import { MarcaComponent } from './marca/marca.component';
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
import { ModuloComponent } from './modulo/modulo.component';
import { EmpresaComponent } from './empresa/empresa.component';
import { CentrocostosComponent } from './centrocostos/centrocostos.component';
import { EntidadfinancieraComponent } from './entidadfinanciera/entidadfinanciera.component';
import { MantenimientotipoComponent } from './mantenimientotipo/mantenimientotipo.component';
import { AlmacenComponent } from './almacen/almacen.component';
import { SexoComponent } from './sexo/sexo.component';
import { LicenciaconducirComponent } from './licenciaconducir/licenciaconducir.component';
import { DocumentotipoComponent } from './documentotipo/documentotipo.component';
import { DocumentoidentidadtipoComponent } from './documentoidentidadtipo/documentoidentidadtipo.component';
import { PaisComponent } from './pais/pais.component';
import { MonedaComponent } from './moneda/moneda.component';
import { ProvinciaComponent } from './provincia/provincia.component';
import { DistritoComponent } from './distrito/distrito.component';
import { PuntofinancieroComponent } from './puntofinanciero/puntofinanciero.component';
import { OrigenfinancieroComponent } from './origenfinanciero/origenfinanciero.component';
import { CuentaCorrienteComponent } from './cuenta-corriente/cuenta-corriente.component';
import { PersonalMarcacionComponent } from './personal-marcacion/personal-marcacion.component';

@NgModule({ declarations: [
        AppComponent,
        MenuBarComponent,
        RolComponent,
        MenuComponent,
        DepartamentoComponent,
        AreaComponent,
        CondicionContractualComponent,
        ContratoTipoComponent,
        CargoComponent,
        PersonalComponent,
        PersonalSituacionComponent,
        InicioComponent,
        RolMenuComponent,
        RolUsuarioComponent,
        LoginComponent,
        ActivoServicioComponent,
        TipoServicioComponent,
        DescansoComponent,
        HorarioComponent,
        PersonalHorarioComponent,
        ReporteMarcacionComponent,
        MarcacionComponent,
        AnalogClockComponent,
        ClienteComponent,
        TipoActivoServicioComponent,
        ParametroActivoServicioComponent,
        MarcaComponent,
        EditActivoComponent,
        OrdenesServicioComponent,
        UbicacionTecnicaComponent,
        LaborComponent,
        OrdenServicioTipoComponent,
        CuentaContableComponent,
        CuentaContableTipoComponent,
        TerceroComponent,
        ManttoOrdenservicioComponent,
        GrupotrabajoComponent,
        OrdentrabajoComponent,
        ModuloComponent,
        EmpresaComponent,
        CentrocostosComponent,
        EntidadfinancieraComponent,
        MantenimientotipoComponent,
        AlmacenComponent,
        SexoComponent,
        LicenciaconducirComponent,
        DocumentotipoComponent,
        DocumentoidentidadtipoComponent,
        PaisComponent,
        MonedaComponent,
        ProvinciaComponent,
        DistritoComponent,
        PuntofinancieroComponent,
        OrigenfinancieroComponent,
        CuentaCorrienteComponent,
        PersonalMarcacionComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        DxButtonModule,
        DxDataGridModule,
        DxMenuModule,
        BlockUIModule.forRoot(),
        DxTreeListModule,
        DxToastModule,
        FormsModule,
        DxPopupModule,
        DxSelectBoxModule,
        DxDateBoxModule,
        DxFormModule,
        DxTextBoxModule,
        DxNumberBoxModule,
        DxValidatorModule,
        DxTabsModule,
        DxTabPanelModule], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class AppModule {
  
 }
