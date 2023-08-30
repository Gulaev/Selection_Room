package com.gulaev.SelectionRoom.payload.request;

import java.util.Date;
import javax.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class EventRequest {

  @NotNull(message = "You need to select the start time")
  private Date start;

  @NotNull(message = "You need to select to end time")
  private Date end;

  private String text;

  private String backColor;

  private Integer participants;

  private String id;
}
