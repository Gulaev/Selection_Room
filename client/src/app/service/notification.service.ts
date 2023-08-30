import { Injectable } from '@angular/core';
import {MatSnackBar} from "@angular/material/snack-bar";

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private snackBar: MatSnackBar) { }

  public showSnackBar(message: string) {
    this.snackBar.open(message, 'close', {
          duration: 1000,
          panelClass: ['black-snackbar']
        }
    )
  }
}
