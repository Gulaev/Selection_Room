package com.gulaev.SelectionRoom.payload.request;

import javax.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class LoginRequest {

  @NotEmpty(message = "Username cant be empty")
  private String username;

  @NotEmpty(message = "Password cant be empty")
  private String password;

}
