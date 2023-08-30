package com.gulaev.SelectionRoom.security;

public class SecurityConstant {

  public static final String SING_UP_URLS = "/api/auth/**";
  public static final String SECRET = "SecretKeyGenJWT";
  public static final String  TOKEN_PREFIX = "Bearer ";
  public static final String HEADER_STRING = "Authorization";
  public static final String CONTENT_TYPE =  "/application/json";
  public static final Long EXPIRATION_TIME = Long.valueOf(2 * 60 * 60 * 1000);

}
