package com.gulaev.SelectionRoom.entity;

import com.gulaev.SelectionRoom.entity.enms.ERole;
import java.util.Collection;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import javax.persistence.CascadeType;
import javax.persistence.CollectionTable;
import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import javax.persistence.Transient;
import lombok.Data;
import net.minidev.json.annotate.JsonIgnore;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

@Data
@Entity
@Table(name = "users")
public class User implements UserDetails {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "username", unique = true)
  private String username;

  @Column(name = "first_name")
  private String firstName;

  @Column(name = "last_name")
  private String lastName;

  @Column(name = "password")
  private String password;

//  @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true
////  ,fetch = FetchType.LAZY)
////  @JoinColumn
////  @JsonIgnore
////  private Set<Event> events = new java.util.LinkedHashSet<>();

  @ElementCollection(targetClass = ERole.class, fetch = FetchType.EAGER)
  @CollectionTable(name = "users_role",
      joinColumns = @JoinColumn(name = "users_id"))
  private Set<ERole> role = new HashSet<>();

  public User(Long id, String username, String firstName, String lastName,String password,
      Collection<?extends GrantedAuthority> authorities) {
    this.id = id;
    this.username = username;
    this.firstName = firstName;
    this.password = password;
    this.lastName = lastName;
    this.authorities = authorities;
  }

//  Security

  @Transient
  private Collection<?extends GrantedAuthority> authorities;

  public User() {
  }

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    return authorities;
  }

  public String getUsername(){
    return username;
  }

  @Override
  public boolean isAccountNonExpired() {
    return true;
  }

  @Override
  public boolean isAccountNonLocked() {
    return true;
  }

  @Override
  public boolean isCredentialsNonExpired() {
    return true;
  }

  @Override
  public boolean isEnabled() {
    return true;
  }

  @Override
  public String getPassword() {
    return password;
  }

//  @Override
//  public int hashCode() {
//    return Objects.hash(id, username);
//  }
//
//  @Override
//  public boolean equals(Object obj) {
//    if (this == obj) return true;
//    if (obj == null || getClass() != obj.getClass()) return false;
//    User other = (User) obj;
//    return Objects.equals(id, other.id) && Objects.equals(username, other.username);
//  }
}

