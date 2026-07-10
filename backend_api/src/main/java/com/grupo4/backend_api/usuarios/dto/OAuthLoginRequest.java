package com.grupo4.backend_api.usuarios.dto;

import java.io.Serializable;

public class OAuthLoginRequest implements Serializable {
  private String idToken;

  public String getIdToken() {
    return idToken;
  }

  public void setIdToken(String idToken) {
    this.idToken = idToken;
  }
}
