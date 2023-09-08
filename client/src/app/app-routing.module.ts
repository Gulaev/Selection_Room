import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {IndexComponent} from "./components/layout/index/index.component";
import {
  LoginRegistrationComponent
} from "./components/auth/login/login-registration/login-registration.component";
import {CalendarComponent} from "./components/scheduling/scheduling.component";
import {EventsComponent} from "./components/events/events/events.component";
import {InfoComponent} from "./components/info/info.component";
import {ContactsComponent} from "./components/contacts/contacts.component";
import {PaymentComponent} from "./components/events/payment/payment.component";

const routes: Routes = [
  {path:'login', component : LoginRegistrationComponent},
  {path:'', component: IndexComponent},
  {path: 'scheduling', component: CalendarComponent},
  {path: 'events', component: EventsComponent},
  {path: 'info', component: InfoComponent},
  {path: 'contacts', component: ContactsComponent},
  {path: 'payment', component: PaymentComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  declarations: [],
  exports: [RouterModule]
})
export class AppRoutingModule { }
