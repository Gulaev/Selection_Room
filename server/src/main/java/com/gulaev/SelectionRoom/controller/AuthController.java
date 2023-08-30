package com.gulaev.SelectionRoom.controller;

import com.gulaev.SelectionRoom.cascade.UserCascade;
import com.gulaev.SelectionRoom.dto.UserDTO;
import com.gulaev.SelectionRoom.entity.User;
import com.gulaev.SelectionRoom.payload.request.LoginRequest;
import com.gulaev.SelectionRoom.payload.response.JWTTokenSuccessResponse;
import com.gulaev.SelectionRoom.payload.response.MessageResponse;
import com.gulaev.SelectionRoom.security.JWTTokenProvider;
import com.gulaev.SelectionRoom.security.SecurityConstant;
import com.gulaev.SelectionRoom.service.ResponseErrorValidation;
import com.gulaev.SelectionRoom.service.UserService;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.security.Principal;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import javax.servlet.http.Cookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.ObjectUtils;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin
@RequestMapping("api/auth")
@PreAuthorize("permitAll()")
public class AuthController {

  private ResponseErrorValidation responseErrorValidation;
  private AuthenticationManager authenticationManager;
  private JWTTokenProvider jwtTokenProvider;
  private UserService userService;

  @Autowired
  public AuthController(ResponseErrorValidation responseErrorValidation,
      AuthenticationManager authenticationManager, JWTTokenProvider jwtTokenProvider,
      UserService userService) {
    this.responseErrorValidation = responseErrorValidation;
    this.authenticationManager = authenticationManager;
    this.jwtTokenProvider = jwtTokenProvider;
    this.userService = userService;
  }

  @PostMapping("/signin")
  public ResponseEntity<Object> login(@Valid @RequestBody LoginRequest loginRequest,
      BindingResult bindingResult, HttpServletResponse response, HttpServletRequest request)
      throws UnsupportedEncodingException {
    ResponseEntity<Object> errors = responseErrorValidation.mapValidationService(bindingResult);
    if (!ObjectUtils.isEmpty(errors)) {

      System.out.println("Error signin");
      return errors;
    }
    Authentication authentication = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));
    SecurityContextHolder.getContext().setAuthentication(authentication);

    String jwt = SecurityConstant.TOKEN_PREFIX + jwtTokenProvider.generateToken(authentication);


//    Cookie cookie = new Cookie("access_token", jwt);
//
//    cookie.setHttpOnly(false);
//    cookie.setMaxAge(24 * 60 * 60); // 24 hours
//    cookie.setPath("/");
//    cookie.setSecure(false); // Allow the cookie over non-secure (HTTP) connections
//    response.addCookie(cookie);

    UserDTO userDTO = UserCascade.userToUserDTO(userService.getUserByUsername(loginRequest.getUsername()));
    return ResponseEntity.ok(
        new JWTTokenSuccessResponse(true, jwt, loginRequest.getUsername(), userDTO));
  }

}
