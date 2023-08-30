package com.gulaev.SelectionRoom.dto;

import java.util.Date;
import lombok.Data;

@Data
public class EventDTO {

  private String id;
  private Date start;
  private Date end;
  private String text;
  private Integer participants;
  private String username;
  private String backColor;

}
