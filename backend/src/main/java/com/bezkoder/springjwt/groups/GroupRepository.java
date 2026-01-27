package com.bezkoder.springjwt.groups;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
    // JpaRepository provides:
    // - save(Group)
    //  - findById(Long)
    // - findAll()
    // - deleteById(Long)
    // - count()
    // - existsById(Long)
    // etc.
    
    // You can add custom query methods here later, for example:
    // List<Group> findByCreatedBy(User user);
    // List<Group> findByNameContaining(String name);
}
