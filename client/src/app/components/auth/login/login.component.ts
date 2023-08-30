import {Component, NgModule} from '@angular/core';
import {FormBuilder, FormGroup, Validator, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {AuthServiceService} from "../../../service/auth-service.service";
import {TokenStorageService} from "../../../service/jwt/token-storage.service";
import {MatDialog} from "@angular/material/dialog";
import {DialogService} from "../../../service/dialog.service";
import {NotificationService} from "../../../service/notification.service";


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  @NgModule({
    declarations:[],
    imports: []
  })

  public loginForm!: FormGroup

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthServiceService,
    private tokenStorage : TokenStorageService,
    private dialogService: DialogService,
    private notification: NotificationService) {}

  createLoginForm() : FormGroup {
    return this.fb.group({
      username: ['', Validators.compose([Validators.required])],
      password: ['', Validators.compose([Validators.required])]
    })
  }

  submit() : void {
    this.authService.login({
      username: this.loginForm.value.username,
      password: this.loginForm.value.password
    }).subscribe( data => {
        this.tokenStorage.setToken(data.token)
        this.tokenStorage.saveUser(data)
        this.dialogService.getDialog().closeAll()
        this.router.navigate(['']).then(window.location.reload)

        this.notification.showSnackBar('Welcome')

      }, error => {
        this.notification.showSnackBar('Wrong password or username')
        console.error('Error:', error)
      }
    )
  }

  ngOnInit() : void {
    this.loginForm = this.createLoginForm()
  }

}
