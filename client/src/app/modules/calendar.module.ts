import {SchedulingService} from "../service/scheduling.service";
import {FormsModule} from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";
import {NgModule} from "@angular/core";
import {DayPilotModule} from "@daypilot/daypilot-lite-angular";
import {HttpClientModule} from "@angular/common/http";
import {CalendarComponent} from "../components/scheduling/scheduling.component";


@NgModule({
  imports:      [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    DayPilotModule
  ],
  declarations: [
    CalendarComponent
  ],
  exports:      [ CalendarComponent ],
  providers:    [ SchedulingService ]
})
export class CalendarModule { }