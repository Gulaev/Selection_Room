import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {IndexComponent} from "./components/layout/index/index.component";
import {
  LoginRegistrationComponent
} from "./components/auth/login/login-registration/login-registration.component";
import {CalendarComponent} from "./components/scheduling/scheduling.component";

const routes: Routes = [
  {path:'login', component : LoginRegistrationComponent},
  {path:'', component: IndexComponent},
  {path: 'scheduling', component: CalendarComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  declarations: [],
  exports: [RouterModule]
})
export class AppRoutingModule { }
