package com.gulaev.SelectionRoom.service;

import com.gulaev.SelectionRoom.cascade.EventCascade;
import com.gulaev.SelectionRoom.entity.Event;
import com.gulaev.SelectionRoom.entity.User;
import com.gulaev.SelectionRoom.payload.request.EventRequest;
import com.gulaev.SelectionRoom.payload.response.MessageResponse;
import com.gulaev.SelectionRoom.repository.EventRepository;
import com.gulaev.SelectionRoom.repository.UserRepository;
import java.security.Principal;
import java.util.List;
import java.util.Optional;
import javax.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventService {


  private UserRepository userRepository;
  private EventRepository eventRepository;
  private EventCascade eventCascade;
  private EntityManagerFactory entityManagerFactory;

  @Autowired
  public EventService(UserRepository userRepository, EventRepository eventRepository,
      EventCascade eventCascade, EntityManagerFactory entityManagerFactory) {
    this.userRepository = userRepository;
    this.eventRepository = eventRepository;
    this.eventCascade = eventCascade;
    this.entityManagerFactory = entityManagerFactory;
  }

  @Transactional
  public Event createEventOrUpdate(EventRequest eventRequest, Principal principal) {
    User user = getUserByPrincipal(principal);

    Optional<Event> eventOptional = eventRepository.findByEventId(eventRequest.getId());

    if (eventOptional.isPresent()) {
      Event updatedEvent = eventOptional.get();
      updatedEvent.setStartEvent(eventRequest.getStart());
      updatedEvent.setEndEvent(eventRequest.getEnd());
      updatedEvent.setParticipants(eventRequest.getParticipants());
      updatedEvent.setBackColor(eventRequest.getBackColor());
      updatedEvent.setText(eventRequest.getText());
      return eventRepository.save(updatedEvent);
    }


    Event event = eventCascade.eventRequestToEvent(eventRequest, user);
    return eventRepository.save(event);
  }


  private User getUserByPrincipal(Principal principal) {
    String username = principal.getName();
    return userRepository.findUserByUsername(username)
        .orElseThrow(() -> new UsernameNotFoundException("This username not found "+username));
  }

  public List<Event> getAllEvent() {
    return eventRepository.findAll();
  }

  public Object delete(EventRequest eventRequest) {
    Optional<Event> eventOptional = eventRepository.findByEventId(eventRequest.getId());
    if (eventOptional.isPresent()) {
      eventRepository.delete(eventOptional.get());
    } else  {
      System.out.println("This event not found");
      return new MessageResponse("This event not found");
    }
    return new MessageResponse("Event delete success");

  }
}
