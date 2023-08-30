package com.gulaev.SelectionRoom.cascade;

import com.gulaev.SelectionRoom.dto.EventDTO;
import com.gulaev.SelectionRoom.entity.Event;
import com.gulaev.SelectionRoom.entity.User;
import com.gulaev.SelectionRoom.payload.request.EventRequest;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import org.springframework.stereotype.Component;

@Component
public class EventCascade {

  public Event eventRequestToEvent(EventRequest eventRequest, User user) {
    Event event = new Event();

//    String startEventISO = eventRequest.getStart().toString();
//    String endEventISO = eventRequest.getEnd().toString();
//
//    Date start;
//    Date end;
//
//    try {
//      start = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX").parse(startEventISO);
//      end = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX").parse(endEventISO);
//    } catch (ParseException e) {
//      System.out.println("bad");
//      // Handle parsing exception
//      return null; // Or some other error handling
//    }

    event.setStartEvent(eventRequest.getStart());
    event.setEndEvent(eventRequest.getEnd());
    event.setText(eventRequest.getText());
    event.setUsername(user.getUsername());
    event.setParticipants(eventRequest.getParticipants());
    event.setBackColor(eventRequest.getBackColor());
    event.setEventId(eventRequest.getId());
    return event;
  }

  public EventDTO eventToEventDTO(Event event) {
    EventDTO eventDTO = new EventDTO();

    Date startEventDate = event.getStartEvent();
    Date endEventDate = event.getEndEvent();

//    Instant startInstant = startEventDate.toInstant();
//    Instant endInstant = endEventDate.toInstant();
//
//    LocalDateTime startLocalDateTime = LocalDateTime.ofInstant(startInstant, ZoneId.systemDefault());
//    LocalDateTime endLocalDateTime = LocalDateTime.ofInstant(endInstant, ZoneId.systemDefault());
//
//    System.out.println(startLocalDateTime);
//    System.out.println(endLocalDateTime);
//
//    Date start = Date.from(startLocalDateTime.atZone(ZoneId.systemDefault()).toInstant());
//    Date end = Date.from(endLocalDateTime.atZone(ZoneId.systemDefault()).toInstant());
//    try {
//      start = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX").parse(String.valueOf(startEventISO));
//      end = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX").parse(endEventISO);
//    } catch (ParseException e) {
//      System.out.println("bad");
      // Handle parsing exception
//      return null; // Or some other error handling
//    }
    eventDTO.setStart(event.getStartEvent());
    eventDTO.setEnd(event.getEndEvent());


    eventDTO.setId(event.getEventId());
    eventDTO.setUsername(event.getUsername());
    eventDTO.setText(event.getText());
    eventDTO.setParticipants(event.getParticipants());
    eventDTO.setBackColor(event.getBackColor());
    return eventDTO;
  }
}