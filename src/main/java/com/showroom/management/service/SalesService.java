package com.showroom.management.service;

import com.showroom.management.dto.*;
import com.showroom.management.entity.SalesEntry;
import com.showroom.management.entity.User;
import com.showroom.management.repository.ExpenseEntryRepository;
import com.showroom.management.repository.SalesEntryRepository;
import com.showroom.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class SalesService {

    private final SalesEntryRepository salesEntryRepository;

    private final ExpenseEntryRepository expenseEntryRepository;
    private final UserRepository userRepository;

    public SalesEntryDTO createSalesEntry(SalesEntryDTO dto, String createdBy) {
        if (salesEntryRepository.existsByBillNumber(dto.getBillNumber())) {
            throw new RuntimeException("Bill number already exists");
        }

        User salesRep = userRepository.findByUsername(dto.getSalesRepUsername())
                .orElseThrow(() -> new RuntimeException("Sales representative not found"));

        SalesEntry salesEntry = new SalesEntry();
        salesEntry.setSalesRep(salesRep);
        salesEntry.setOutlet(salesRep.getOutlet());
        salesEntry.setDateTime(dto.getDateTime());
        salesEntry.setBillNumber(dto.getBillNumber());
        salesEntry.setAmount(dto.getAmount());
        salesEntry.setPaymentType(dto.getPaymentType());
        salesEntry.setCreatedBy(createdBy);

        SalesEntry saved = salesEntryRepository.save(salesEntry);
        return SalesEntryDTO.fromEntity(saved);
    }

    public List<SalesEntryDTO> getFilteredSales(String outlet, LocalDateTime fromDate,
                                                LocalDateTime toDate, String salesRepUsername,
                                                SalesEntry.PaymentType paymentType) {

        // Convert parameters to safe values
        String safeOutlet = (outlet == null || outlet.trim().isEmpty()) ? "All Outlets" : outlet;
        LocalDateTime safeFromDate = (fromDate == null) ? LocalDateTime.of(1900, 1, 1, 0, 0) : fromDate;
        LocalDateTime safeToDate = (toDate == null) ? LocalDateTime.of(2099, 12, 31, 23, 59) : toDate;

        // Handle sales rep
        Long salesRepId = null;
        if (salesRepUsername != null && !salesRepUsername.trim().isEmpty()) {
            Optional<User> salesRepOpt = userRepository.findByUsername(salesRepUsername);
            if (salesRepOpt.isPresent()) {
                salesRepId = salesRepOpt.get().getId();
            }
        }

        // Handle payment type
        String paymentTypeStr = (paymentType != null) ? paymentType.name() : null;

        List<SalesEntry> sales = salesEntryRepository.findFilteredSalesNative(
                safeOutlet, safeFromDate, safeToDate, salesRepId, paymentTypeStr);

        return sales.stream()
                .map(SalesEntryDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<SalesEntryDTO> getSalesForUser(String username, String userRole, String userOutlet,
                                               LocalDateTime fromDate, LocalDateTime toDate) {
        if ("SALES".equals(userRole)) {
            // Sales rep can only see their own sales
            List<SalesEntry> sales = salesEntryRepository.findBySalesRepAndDateRange(
                    username, fromDate, toDate);
            return sales.stream()
                    .map(SalesEntryDTO::fromEntity)
                    .collect(Collectors.toList());
        } else {
            // Manager/Owner can see all sales in their scope
            return getFilteredSales(userOutlet, fromDate, toDate, null, null);
        }
    }

    public DashboardStatsDTO getDashboardStats(String outlet, LocalDateTime fromDate, LocalDateTime toDate) {
        // Convert parameters to safe values for database queries
        String safeOutlet = (outlet == null || outlet.trim().isEmpty()) ? "All Outlets" : outlet;
        LocalDateTime safeFromDate = (fromDate == null) ? LocalDateTime.of(1900, 1, 1, 0, 0) : fromDate;
        LocalDateTime safeToDate = (toDate == null) ? LocalDateTime.of(2099, 12, 31, 23, 59) : toDate;

        // Get sales stats
        BigDecimal totalSales = salesEntryRepository.getTotalSales(safeOutlet, safeFromDate, safeToDate);
        Long totalTransactions = salesEntryRepository.getTotalTransactions(safeOutlet, safeFromDate, safeToDate);

        // Get expense stats (convert datetime to date for expense queries)
        LocalDate fromDateOnly = safeFromDate.toLocalDate();
        LocalDate toDateOnly = safeToDate.toLocalDate();

        // You'll need to inject ExpenseService or ExpenseEntryRepository here
        // For now, setting expenses to zero - you can add this later
        BigDecimal totalExpenses = expenseEntryRepository.getTotalExpenses(safeOutlet, safeFromDate, safeToDate);

        if (totalSales == null) totalSales = BigDecimal.ZERO;
        if (totalTransactions == null) totalTransactions = 0L;

        BigDecimal netProfit = totalSales.subtract(totalExpenses);

        return new DashboardStatsDTO(totalSales, totalExpenses, netProfit, totalTransactions);
    }

    public DashboardStatsDTO getDashboardStatsForSalesRep(String salesRepUsername,
                                                          LocalDateTime fromDate,
                                                          LocalDateTime toDate) {

        log.info("Getting dashboard stats for sales rep: {}", salesRepUsername);

        // Convert parameters to safe values
        LocalDateTime safeFromDate = (fromDate == null) ? LocalDateTime.of(1900, 1, 1, 0, 0) : fromDate;
        LocalDateTime safeToDate = (toDate == null) ? LocalDateTime.of(2099, 12, 31, 23, 59) : toDate;

        // Get sales rep user
        User salesRep = userRepository.findByUsername(salesRepUsername)
                .orElseThrow(() -> new RuntimeException("Sales representative not found"));

        // Get only this sales rep's data
        BigDecimal totalSales = salesEntryRepository.getTotalSalesBySalesRep(
                salesRep.getId(), safeFromDate, safeToDate);
        Long totalTransactions = salesEntryRepository.getTotalTransactionsBySalesRep(
                salesRep.getId(), safeFromDate, safeToDate);

        if (totalSales == null) totalSales = BigDecimal.ZERO;
        if (totalTransactions == null) totalTransactions = 0L;

        // Sales reps don't see expenses or profit - just their sales performance
        BigDecimal totalExpenses = BigDecimal.ZERO;
        BigDecimal netProfit = totalSales; // For sales rep, "profit" is their sales contribution

        log.info("Sales rep {} stats: Sales={}, Transactions={}",
                salesRepUsername, totalSales, totalTransactions);

        return new DashboardStatsDTO(totalSales, totalExpenses, netProfit, totalTransactions);
    }
}