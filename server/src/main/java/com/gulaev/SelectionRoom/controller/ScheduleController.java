package com.gulaev.SelectionRoom.controller;

import com.gulaev.SelectionRoom.cascade.EventCascade;
import com.gulaev.SelectionRoom.dto.EventDTO;
import com.gulaev.SelectionRoom.payload.request.EventRequest;
import com.gulaev.SelectionRoom.service.EventService;
import com.gulaev.SelectionRoom.service.ResponseErrorValidation;
import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;
import javax.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.util.ObjectUtils;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin
@RestController
@RequestMapping("api/schedule")
public class ScheduleController {

  private EventService eventService;
  private ResponseErrorValidation errorValidation;
  private EventCascade eventCascade;

  @Autowired
  public ScheduleController(EventService eventService, ResponseErrorValidation errorValidation,
      EventCascade eventCascade) {
    this.eventService = eventService;
    this.errorValidation = errorValidation;
    this.eventCascade = eventCascade;
  }


  @PostMapping("/create")
  public ResponseEntity<Object> create(@Valid @RequestBody EventRequest eventRequest,
      Principal principal, BindingResult bindingResult) {
    ResponseEntity<Object> errors = errorValidation.mapValidationService(bindingResult);
    if (!ObjectUtils.isEmpty(errors)) {
      System.out.println("Error signin");
      return errors;
    }
    return ResponseEntity.ok(eventService.createEventOrUpdate(eventRequest, principal));
  }

  @GetMapping("/all")
  public ResponseEntity<Object> getAllEvents(Principal principal) {
    List<EventDTO> collect = eventService.getAllEvent().stream()
        .map(eventCascade::eventToEventDTO)
        .collect(Collectors.toList());
    return ResponseEntity.ok(collect);
  }

  @PostMapping("/delete")
  public ResponseEntity<Object> deleteEvent(@Valid @RequestBody EventRequest eventRequest,
      Principal principal, BindingResult bindingResult) {
    ResponseEntity<Object> errors = errorValidation.mapValidationService(bindingResult);
    if (!ObjectUtils.isEmpty(errors)) {
      System.out.println("Error singin");
      return errors;
    }
    return ResponseEntity.ok(eventService.delete(eventRequest));
  }


}
