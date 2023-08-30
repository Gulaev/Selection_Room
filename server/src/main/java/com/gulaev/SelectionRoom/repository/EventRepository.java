package com.gulaev.SelectionRoom.repository;

import com.gulaev.SelectionRoom.entity.Event;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

  Optional<Event> findByEventId(String id);
}
