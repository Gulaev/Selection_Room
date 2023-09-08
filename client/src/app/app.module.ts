import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {LoginComponent} from "./components/auth/login/login.component";
import {authInterceptorProviders} from "./interceptors/auth.interceptor";
import {authErrorInterceptorProviders} from "./interceptors/error.interceptor";
import {ReactiveFormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatButtonModule} from "@angular/material/button";
import {HttpClientModule} from "@angular/common/http";
import {MaterialModule} from "./modules/material-module";
import { IndexComponent } from './components/layout/index/index.component';
import {NavigationComponent} from "./components/layout/navigation/navigation.component";
import { LoginRegistrationComponent } from './components/auth/login/login-registration/login-registration.component';
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {ButtonModule} from "smart-webcomponents-angular/button";
import {CalendarModule} from "smart-webcomponents-angular/calendar";
import {SchedulerModule} from "smart-webcomponents-angular/scheduler";
import {InputModule} from "smart-webcomponents-angular/input";
import {TreeModule} from "smart-webcomponents-angular/tree";
import {CalendarComponent} from "./components/scheduling/scheduling.component";
import {SmartWebComponentModule} from "./modules/smart-web-component.module";
import {DayPilotModule} from "@daypilot/daypilot-lite-angular";
import { EventsComponent } from './components/events/events/events.component';
import { InfoComponent } from './components/info/info.component';
import { ContactsComponent } from './components/contacts/contacts.component';
import { PaymentComponent } from './components/events/payment/payment.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    IndexComponent,
    NavigationComponent,
    LoginRegistrationComponent,
    CalendarComponent,
    EventsComponent,
    InfoComponent,
    ContactsComponent,
    PaymentComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    HttpClientModule,
    MaterialModule,
    MatSnackBarModule,
    SmartWebComponentModule,
    DayPilotModule
  ],
  providers: [authInterceptorProviders, authErrorInterceptorProviders],
  bootstrap: [AppComponent]
})
export class AppModule { }
