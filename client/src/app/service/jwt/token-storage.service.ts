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
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.setItem(TOKEN_KEY, token)
    console.log(window.localStorage.getItem(TOKEN_KEY))
  }

  public getToken() : string | any {
    console.log(window.localStorage.getItem(TOKEN_KEY))
    return window.localStorage.getItem(TOKEN_KEY)
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenPrefix)
  }

  public saveUser(user : any) : void {
    window.localStorage.removeItem(user.username);
    const userCurrent: User = {
      id: user.userDTO.id,
      username: user.userDTO.username,
      firstName: user.userDTO.firstName,
      lastName: user.userDTO.lastName
    };
    window.localStorage.setItem(this.tokenPrefix, JSON.stringify(userCurrent));
    console.log(window.localStorage.getItem(this.tokenPrefix))
  }

  public getUser(): any {
    const userStr = window.localStorage.getItem(this.tokenPrefix);
    console.log(window.localStorage.getItem(this.tokenPrefix))
    return userStr ? JSON.parse(userStr) : null;
  }

  logOut() : void {
    window.localStorage.clear()
    window.location.reload()
  }



}
