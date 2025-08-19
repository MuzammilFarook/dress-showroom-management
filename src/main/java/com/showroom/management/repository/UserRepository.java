package com.showroom.management.repository;

import com.showroom.management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    List<User> findByRole(User.Role role);

    List<User> findByOutlet(String outlet);

    List<User> findByRoleAndOutlet(User.Role role, String outlet);

    @Query("SELECT u FROM User u WHERE u.role = :role AND (:outlet = 'All Outlets' OR u.outlet = :outlet)")
    List<User> findByRoleAndOutletFiltered(@Param("role") User.Role role, @Param("outlet") String outlet);

    boolean existsByUsername(String username);

    List<User> findByIsActiveTrue();
}