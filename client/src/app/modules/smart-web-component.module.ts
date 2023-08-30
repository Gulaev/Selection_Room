import { NgModule } from '@angular/core';
import {BrowserModule} from "@angular/platform-browser";
import {ButtonModule} from "smart-webcomponents-angular/button";
import {CalendarModule} from "smart-webcomponents-angular/calendar";
import {InputModule} from "smart-webcomponents-angular/input";
import {TreeModule} from "smart-webcomponents-angular/tree";
import {SchedulerModule} from "smart-webcomponents-angular/scheduler";



@NgModule({
  exports: [BrowserModule,
            ButtonModule,
            CalendarModule,
            InputModule,
            TreeModule,
            SchedulerModule
  ]
})
export class SmartWebComponentModule { }
