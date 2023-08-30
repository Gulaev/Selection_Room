package com.gulaev.SelectionRoom.cascade;

import com.gulaev.SelectionRoom.dto.UserDTO;
import com.gulaev.SelectionRoom.entity.User;

public class UserCascade {

  public static UserDTO userToUserDTO(User user) {
    UserDTO userDTO = new UserDTO();
    userDTO.setId(user.getId());
    userDTO.setFirstName(user.getFirstName());
    userDTO.setUsername(user.getUsername());
    userDTO.setLastName(user.getLastName());
    return userDTO;
  }

}
