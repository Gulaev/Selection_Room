import { Injectable } from '@angular/core';
import {User} from "../../models/User";

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user '

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {


  private readonly tokenPrefix = 'user_token_';

  constructor() { }

  public setToken(token:string) :void {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.setItem(TOKEN_KEY, token)
  }


  public getToken() : string | any {
    return sessionStorage.getItem(TOKEN_KEY)
  }


  removeToken(): void {
    localStorage.removeItem(this.tokenPrefix)
  }

  public saveUser(user : any) : void {
    sessionStorage.removeItem(user.username);
    const userCurrent: User = {
      id: user.userDTO.id,
      username: user.userDTO.username,
      firstName: user.userDTO.firstName,
      lastName: user.userDTO.lastName
    };
    sessionStorage.setItem(user.username, JSON.stringify(userCurrent));
    console.log(localStorage.getItem(user.username))
  }

  public getUser(): any {
    const userStr = sessionStorage.getItem(this.tokenPrefix);
    return userStr ? JSON.parse(userStr) : null;
  }


  logOut() : void {
    window.sessionStorage.clear()
    window.location.reload()
  }



}
