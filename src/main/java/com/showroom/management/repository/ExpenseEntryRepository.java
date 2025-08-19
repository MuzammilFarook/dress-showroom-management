package com.showroom.management.repository;

import com.showroom.management.entity.ExpenseEntry;
import com.showroom.management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExpenseEntryRepository extends JpaRepository<ExpenseEntry, Long> {
    List<ExpenseEntry> findByOutlet(String outlet);

    List<ExpenseEntry> findByType(ExpenseEntry.ExpenseType type);

    List<ExpenseEntry> findByAdvanceTo(User advanceTo);

    @Query(value = "SELECT * FROM expense_entries e WHERE " +
            "(e.outlet = :outlet OR :outlet = 'All Outlets') AND " +
            "e.date >= CAST(:fromDate AS date) AND " +
            "e.date <= CAST(:toDate AS date) AND " +
            "(:type IS NULL OR e.type = :type) AND " +
            "(:advanceToId IS NULL OR e.advance_to_id = :advanceToId) " +
            "ORDER BY e.date DESC",
            nativeQuery = true)
    List<ExpenseEntry> findFilteredExpensesNative(@Param("outlet") String outlet,
                                                  @Param("fromDate") LocalDate fromDate,
                                                  @Param("toDate") LocalDate toDate,
                                                  @Param("type") String type,
                                                  @Param("advanceToId") Long advanceToId);

    @Query(value = "SELECT COALESCE(SUM(e.amount), 0) FROM expense_entries e WHERE " +
            "(e.outlet = :outlet OR :outlet = 'All Outlets') AND " +
            "e.date >= CAST(:fromDate AS timestamp) AND " +
            "e.date <= CAST(:toDate AS timestamp)",
            nativeQuery = true)
    BigDecimal getTotalExpenses(@Param("outlet") String outlet,
                                @Param("fromDate") LocalDateTime fromDate,
                                @Param("toDate") LocalDateTime toDate);

    @Query("SELECT e FROM ExpenseEntry e WHERE " +
            "e.type = 'ADVANCE' AND e.advanceTo.username = :username AND " +
            "FUNCTION('DATE', e.date) >= :fromDate AND FUNCTION('DATE', e.date) <= :toDate " +
            "ORDER BY e.date DESC")
    List<ExpenseEntry> findAdvancesByEmployeeAndDateRange(@Param("username") String username,
                                                          @Param("fromDate") LocalDateTime fromDate,
                                                          @Param("toDate") LocalDateTime toDate);
}