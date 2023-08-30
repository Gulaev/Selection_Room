import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";

const AUTH_API = "http://localhost:8080/api/auth/"


@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {

  constructor(private http: HttpClient) { }

  public login(user:any) : Observable<any> {
    return this.http.post(AUTH_API + 'signin',
      {
        headers: new HttpHeaders({
          'Access-Control-Allow-Origin': '*',  observe: "response",
        'Access-Control-Allow-Credentials': 'true'}),
      username : user.username,
      password : user.password,
      user : {
        withCredentials: true,
        responseType: 'json'
      }
    })
  }


}
