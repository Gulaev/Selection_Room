package com.gulaev.SelectionRoom.security;

import com.gulaev.SelectionRoom.service.CustomUserDetailsService;
import java.io.IOException;
import java.util.Collections;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JWTAuthenticationFilter extends OncePerRequestFilter {

  @Autowired
  private JWTTokenProvider jwtTokenProvider;
  @Autowired
  private CustomUserDetailsService customUserDetailsService;

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {
    try {
      String jwt = getJWTFromRequest(request);
      if (jwtTokenProvider.validateToken(jwt)){
        Long userId = jwtTokenProvider.getUserIdFromToken(jwt);

        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
            customUserDetailsService.loadUserById(userId), null, Collections.emptyList()
        );
        authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authenticationToken);
      }
    } catch (Exception e) {

    } finally {
      filterChain.doFilter(request, response);
    }
  }

  private String getJWTFromRequest(HttpServletRequest request) {
    String bearToken = request.getHeader(SecurityConstant.HEADER_STRING);
    if (StringUtils.hasText(bearToken) && bearToken.startsWith(SecurityConstant.TOKEN_PREFIX)) {
      return bearToken.split(" ")[1];
    } else {
    return "No data request";
  }
  }
}
