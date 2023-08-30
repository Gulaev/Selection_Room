package com.gulaev.SelectionRoom.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.Date;
import java.util.Objects;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import lombok.Data;

@Entity
@Data
public class Event {

  @Id
  @GeneratedValue(strategy = GenerationType.SEQUENCE)
  @Column(name = "id", nullable = false)
  private Long id;

  @Column(name = "event_id")
  private String eventId;

//  @ManyToOne(optional = false)
//  @JoinColumn(name = "user_id", nullable = false)
//  @JsonIgnore
//  private User user;

  @Column(name = "username")
  private String username;

  @Column(name = "start_event")
  private Date startEvent;

  @Column(name = "end_event")
  private Date endEvent;


  @Column(name = "text")
  private String text;

  @Column(name = "participants")
  private Integer participants;

  @Column(name = "back_color")
  private String backColor;

//  @Override
//  public int hashCode() {
//    return Objects.hash(id, startEvent, endEvent);
//  }
//
//  @Override
//  public boolean equals(Object obj) {
//    if (this == obj) return true;
//    if (obj == null || getClass() != obj.getClass()) return false;
//    Event other = (Event) obj;
//    return Objects.equals(id, other.id)
//        && Objects.equals(startEvent, other.startEvent)
//        && Objects.equals(endEvent, other.endEvent);
//  }
}
