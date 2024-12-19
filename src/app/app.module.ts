import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DxButtonModule, DxDataGridModule, DxToastModule, DxPopupModule, DxSelectBoxModule, DxDateBoxModule, DxFormModule, DxTextBoxModule, DxNumberBoxModule, DxValidatorModule, DxTabsModule, DxTabPanelModule } from 'devextreme-angular';
import { MenuBarComponent } from './menu-bar/menu-bar.component';
import { DxMenuModule, DxMenuTypes } from 'devextreme-angular/ui/menu';
import { RolComponent } from './rol/rol.component';
import { HttpClientModule } from '@angular/common/http';
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

@NgModule({
  declarations: [
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
    EditActivoComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    DxButtonModule,
    DxDataGridModule,
    DxMenuModule,
    HttpClientModule,
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
    DxTabPanelModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
  
 }
