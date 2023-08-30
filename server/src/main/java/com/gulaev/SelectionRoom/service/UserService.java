package com.gulaev.SelectionRoom.service;

import com.gulaev.SelectionRoom.entity.User;
import com.gulaev.SelectionRoom.repository.UserRepository;
import java.security.Principal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserService {

  private final UserRepository userRepository;

  @Autowired
  public UserService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }


  public User getUserByPrincipal(Principal principal) {
    String username = principal.getName();
    return userRepository.findUserByUsername(username)
        .orElseThrow(() -> new UsernameNotFoundException("Cant find this username " + username));
  }

  public User getUserByUsername(String username) {
    return userRepository.findUserByUsername(username)
        .orElseThrow(() -> new UsernameNotFoundException("Cant find this username " + username));
  }

}
