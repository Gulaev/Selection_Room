import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {catchError, map, Observable, of, throwError} from "rxjs";
import {TokenStorageService} from "./jwt/token-storage.service";
import {DayPilot} from "@daypilot/daypilot-lite-angular";
import {Post} from "../models/Post";
import {Router} from "@angular/router";
import {DialogService} from "./dialog.service";
import {MatDialog} from "@angular/material/dialog";
import {NotificationService} from "./notification.service";


// import * as constants from "constants";


const SCHEDULING_API = "http://localhost:8080/api/schedule/"
const TOKEN_HEADER_KEY = 'Authorization';


@Injectable({
  providedIn: 'root'
})
export class SchedulingService {

  static colors = {
    green: "#6aa84f",
    yellow: "#f1c232",
    red: "#cc4125",
    gray: "#808080",
    blue: "#2e78d6",
  };

  constructor(private http: HttpClient,
              private tokenStorage: TokenStorageService,
              private router: Router,
              private notification: NotificationService) {
  }

  getEvents(from: DayPilot.Date, to: DayPilot.Date): Observable<any[]> {
    if (this.events.length > 0) {
      return of(this.events);
    } else {
      return this.allEvents().pipe(
          catchError(error => {
            console.error('An error occurred:', error);
            this.router.navigate(['/']);
            this.notification.showSnackBar("You need to login")
            return throwError('Error occurred while fetching events.');
          })
      );
    }
  }

  allEvents(): Observable<any[]> {
    const headers = this.getDataWithHeaders();
    return this.http.get<any[]>(SCHEDULING_API + 'all', {headers}).pipe(
        map((data: any[]) => {
          const events: DayPilot.EventData[] = [];
          for (const item of data) {

            const start = new Date(item.start.toString());
            const iso8601Start = start.toISOString();

            const end = new Date(item.end.toString());
            const iso8601End = end.toISOString();

            const eve = {
              id: item.id ? item.id : DayPilot.guid(),
              text: item.text,
              start: new DayPilot.Date(iso8601Start),
              end: new DayPilot.Date(iso8601End),
              backColor: item.backColor ? item.backColor : SchedulingService.colors.blue,
              participants: item.participants ? item.participants : 1
            };
            events.push(eve);
          }
          return events;
        })
    );
  }

  events: DayPilot.EventData[] = [
    // {
    //   id: 1,
    //   text: "Event 1",
    //   start: DayPilot.Date.today().firstDayOfWeek().addHours(10),
    //   end: DayPilot.Date.today().firstDayOfWeek().addHours(13),
    //   participants: 2,
    // },
    // {
    //   id: 2,
    //   text: "Event 2",
    //   start: DayPilot.Date.today().firstDayOfWeek().addDays(1).addHours(12),
    //   end: DayPilot.Date.today().firstDayOfWeek().addDays(1).addHours(15),
    //   backColor: SchedulingService.colors.green,
    //   participants: 1,
    // },
    // {
    //   id: 3,
    //   text: "Event 3",
    //   start: DayPilot.Date.today().firstDayOfWeek().addDays(2).addHours(13),
    //   end: DayPilot.Date.today().firstDayOfWeek().addDays(2).addHours(16),
    //   backColor: SchedulingService.colors.yellow,
    //   participants: 3,
    // },
    // {
    //   id: 4,
    //   text: "Event 4",
    //   start: DayPilot.Date.today().firstDayOfWeek().addDays(3).addHours(11),
    //   end: DayPilot.Date.today().firstDayOfWeek().addDays(3).addHours(15),
    //   backColor: SchedulingService.colors.red,
    //   participants: 4,
    // },
  ];


  public getDataWithHeaders(): HttpHeaders {
    const  headers = new HttpHeaders({
      'Authorization': this.tokenStorage.getToken(),
    });
    // return headers.append('Access-Control-Allow-Origin', '*')
    // .append('Access-Control-Allow-Credentials', 'true')
    // .append('observe', 'response')
    // .append('Content-Type', 'application/json')
    return headers;
  }

  getColors(): any[] {
    const colors = [
      {name: "Green", id: SchedulingService.colors.green},
      {name: "Yellow", id: SchedulingService.colors.yellow},
      {name: "Red", id: SchedulingService.colors.red},
      {name: "Gray", id: SchedulingService.colors.gray},
      {name: "Blue", id: SchedulingService.colors.blue},
    ];
    return colors;
  }

  saveEvents(events: any[]): Observable<any> {
    const headers = this.getDataWithHeaders()
    return this.http.post(SCHEDULING_API + 'update', {
      headers: headers,
      eventRequest: events
    });
  }

  addEventOrUpdate(event: any): Observable<any> {
    const headers = this.getDataWithHeaders();
    return this.http.post(SCHEDULING_API + 'create', event, {
      headers
    })
  }

  deleteEvent(event: any): Observable<any> {
    const headers = this.getDataWithHeaders();
    const mergedHeaders = headers.append('Access-Control-Allow-Origin', '*')
    .append('Access-Control-Allow-Credentials', 'true')
    .append('observe', 'response')
    .append('Content-Type', 'application/json')

    return this.http.post(SCHEDULING_API + 'delete', event, {
      headers: mergedHeaders
    })
  }
}
