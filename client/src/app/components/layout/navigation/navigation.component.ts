import { Component } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {TokenStorageService} from "../../../service/jwt/token-storage.service";
import {User} from "../../../models/User";
import {UserService} from "../../../service/user.service";

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent {
  isUserLogin: boolean = false;
  user!: User

  constructor(private router: Router, private route: ActivatedRoute,
              private tokenStorage: TokenStorageService,
              private userService: UserService) {}

  ngOnInit() {
    const currentUser = this.userService.getCurrentUser();
    console.log(currentUser)
    if (currentUser) {
      currentUser.subscribe(u => {
        this.user = u
        this.isUserLogin = true;
      });

    }
  }

  clickLogin() {
    const url = this.router.url
    if (url.startsWith('/login')) {
      location.reload()
    } else {
      this.router.navigate(['/login'])
    }
  }

}
