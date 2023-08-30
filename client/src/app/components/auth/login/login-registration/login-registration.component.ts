import {Component, OnInit} from '@angular/core';
import {MatDialog} from "@angular/material/dialog";
import {LoginComponent} from "../login.component";
import {DialogService} from "../../../../service/dialog.service";

@Component({
  selector: 'app-login-registration',
  templateUrl: './login-registration.component.html',
  styleUrls: ['./login-registration.component.css']
})
export class LoginRegistrationComponent implements OnInit{

  constructor(private dialog: MatDialog,
              private dialogService: DialogService) {}

  openRegistrationDialog(enterAnimationDuration: string, exitAnimationDuration: string): void {
    this.dialog.open(LoginComponent, {
      width: '750px',
      height: '400px',
      enterAnimationDuration,
      exitAnimationDuration,
      // backdropClass: 'dialog::backdrop'
    });
    this.dialogService.setDialog(this.dialog)
  }


  ngOnInit(): void {
    this.openRegistrationDialog('2000ms', '1000ms')
  }
}
