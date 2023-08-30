import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {TokenStorageService} from "./jwt/token-storage.service";
import {Observable} from "rxjs";
import {User} from "../models/User";


const USER_API = "http://localhost:8080/api/user/"

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient,
              private tokenStorage: TokenStorageService) {
  }

  getCurrentUser(): Observable<any> {
    const headers = this.getDataWithHeaders()
    // const mergedHeaders = headers.append('Access-Control-Allow-Origin', '*')


    return this.http.get(USER_API, {
      headers:headers
    });
  }

  public getDataWithHeaders(): HttpHeaders {
    const headers = new HttpHeaders({
      'Authorization': this.tokenStorage.getToken(),
    });


    return headers;
  }
}
