package com.showroom.management.repository;

import com.showroom.management.entity.SalesEntry;
import com.showroom.management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SalesEntryRepository extends JpaRepository<SalesEntry, Long> {
    boolean existsByBillNumber(String billNumber);

    List<SalesEntry> findByOutlet(String outlet);

    List<SalesEntry> findBySalesRep(User salesRep);



    @Query(value = "SELECT * FROM sales_entries s WHERE " +
            "(s.outlet = :outlet OR :outlet = 'All Outlets') AND " +
            "s.date_time >= CAST(:fromDate AS timestamp) AND " +
            "s.date_time <= CAST(:toDate AS timestamp) AND " +
            "(:salesRepId IS NULL OR s.sales_rep_id = :salesRepId) AND " +
            "(:paymentType IS NULL OR s.payment_type = :paymentType) " +
            "ORDER BY s.date_time DESC",
            nativeQuery = true)
    List<SalesEntry> findFilteredSalesNative(@Param("outlet") String outlet,
                                             @Param("fromDate") LocalDateTime fromDate,
                                             @Param("toDate") LocalDateTime toDate,
                                             @Param("salesRepId") Long salesRepId,
                                             @Param("paymentType") String paymentType);

    @Query(value = "SELECT COALESCE(SUM(s.amount), 0) FROM sales_entries s WHERE " +
            "(s.outlet = :outlet OR :outlet = 'All Outlets') AND " +
            "s.date_time >= CAST(:fromDate AS timestamp) AND " +
            "s.date_time <= CAST(:toDate AS timestamp)",
            nativeQuery = true)
    BigDecimal getTotalSales(@Param("outlet") String outlet,
                             @Param("fromDate") LocalDateTime fromDate,
                             @Param("toDate") LocalDateTime toDate);

    @Query(value = "SELECT COUNT(*) FROM sales_entries s WHERE " +
            "(s.outlet = :outlet OR :outlet = 'All Outlets') AND " +
            "s.date_time >= CAST(:fromDate AS timestamp) AND " +
            "s.date_time <= CAST(:toDate AS timestamp)",
            nativeQuery = true)
    Long getTotalTransactions(@Param("outlet") String outlet,
                              @Param("fromDate") LocalDateTime fromDate,
                              @Param("toDate") LocalDateTime toDate);

    @Query(value = "SELECT COALESCE(SUM(s.amount), 0) FROM sales_entries s WHERE " +
            "s.sales_rep_id = :salesRepId AND " +
            "s.date_time >= CAST(:fromDate AS timestamp) AND " +
            "s.date_time <= CAST(:toDate AS timestamp)",
            nativeQuery = true)
    BigDecimal getTotalSalesBySalesRep(@Param("salesRepId") Long salesRepId,
                                       @Param("fromDate") LocalDateTime fromDate,
                                       @Param("toDate") LocalDateTime toDate);

    @Query(value = "SELECT COUNT(*) FROM sales_entries s WHERE " +
            "s.sales_rep_id = :salesRepId AND " +
            "s.date_time >= CAST(:fromDate AS timestamp) AND " +
            "s.date_time <= CAST(:toDate AS timestamp)",
            nativeQuery = true)
    Long getTotalTransactionsBySalesRep(@Param("salesRepId") Long salesRepId,
                                        @Param("fromDate") LocalDateTime fromDate,
                                        @Param("toDate") LocalDateTime toDate);
    @Query("SELECT s FROM SalesEntry s WHERE " +
            "s.salesRep.username = :username AND " +
            "s.dateTime >= :fromDate AND s.dateTime <= :toDate " +
            "ORDER BY s.dateTime DESC")
    List<SalesEntry> findBySalesRepAndDateRange(@Param("username") String username,
                                                @Param("fromDate") LocalDateTime fromDate,
                                                @Param("toDate") LocalDateTime toDate);
}