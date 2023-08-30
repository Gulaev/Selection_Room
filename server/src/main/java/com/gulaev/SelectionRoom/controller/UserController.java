package com.gulaev.SelectionRoom.controller;

import com.gulaev.SelectionRoom.cascade.UserCascade;
import com.gulaev.SelectionRoom.service.UserService;
import java.security.Principal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

  private UserService userService;


  @Autowired
  public UserController(UserService userService) {
    this.userService = userService;

  }

  @GetMapping("/")
  public ResponseEntity<Object> getCurrentUser(Principal principal) {
    return ResponseEntity.ok(UserCascade.userToUserDTO(userService.getUserByPrincipal(principal)));
  }




}
