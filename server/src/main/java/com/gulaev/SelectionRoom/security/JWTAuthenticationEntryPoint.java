package com.gulaev.SelectionRoom.security;

import com.google.gson.Gson;
import com.gulaev.SelectionRoom.payload.response.InvalidLoginResponse;
import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

@Component
public class JWTAuthenticationEntryPoint implements AuthenticationEntryPoint {

  @Override
  public void commence(HttpServletRequest httpServletRequest,
      HttpServletResponse httpServletResponse, AuthenticationException e)
      throws IOException, ServletException {
    InvalidLoginResponse loginResponse = new InvalidLoginResponse();
    String jsonLoginResponse = new Gson().toJson(loginResponse);
    httpServletResponse.setContentType(SecurityConstant.CONTENT_TYPE);
    httpServletResponse.setStatus(HttpStatus.UNAUTHORIZED.value());
    httpServletResponse.getWriter().println(jsonLoginResponse);
  }
}
