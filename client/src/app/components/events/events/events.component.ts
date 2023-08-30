import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css']
})
export class EventsComponent implements OnInit{

  event = {
    name: 'Selection Room 15/07',
    description: 'Charity party in Keller bar',
    startDate: Date.UTC(2023,7, 15),
    imagePath: '../assets/images/IMG_3488.PNG',
    price: 300
  }





  ngOnInit(): void {
  }

}
