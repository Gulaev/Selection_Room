import { Injectable } from '@angular/core';
import {MatDialog} from "@angular/material/dialog";

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  constructor() { }

  dialog!: MatDialog

  setDialog(dialog: MatDialog) {
    this.dialog = dialog
  }

  getDialog() : MatDialog {
    return this.dialog
  }
}
