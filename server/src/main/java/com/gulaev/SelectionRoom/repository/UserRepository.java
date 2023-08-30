package com.gulaev.SelectionRoom.repository;

import com.gulaev.SelectionRoom.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

      Optional<User> findUserByUsername(String username);
}
