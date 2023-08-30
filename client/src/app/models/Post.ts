import {DayPilot} from "@daypilot/daypilot-lite-angular";


export class Post{

  id: number;
  start: DayPilot.Date;
  end: DayPilot.Date;
  text: string;
  data: any;
  resource: string;
  duration: number;
  participants: any;

  constructor(
      id: number,
      start: DayPilot.Date,
      end: DayPilot.Date,
      text: string,
      data: any,
      resource: string = 'default',
      duration: number = 1
  ) {
    this.id = id;
    this.start = start;
    this.end = end;
    this.text = text;
    this.data = data;
    this.resource = resource;
    this.duration = duration;
  }
}