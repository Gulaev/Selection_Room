package com.gulaev.SelectionRoom.payload.response;

import com.gulaev.SelectionRoom.dto.UserDTO;
import com.gulaev.SelectionRoom.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class JWTTokenSuccessResponse {

  private boolean success;
  private String token;
  private String username;
  private UserDTO userDTO;

}
