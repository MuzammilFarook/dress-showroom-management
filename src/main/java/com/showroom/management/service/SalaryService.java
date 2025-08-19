package com.showroom.management.service;

import com.showroom.management.dto.*;
import com.showroom.management.entity.SalesEntry;
import com.showroom.management.entity.ExpenseEntry;
import com.showroom.management.entity.User;
import com.showroom.management.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SalaryService {

    private final UserRepository userRepository;
    private final SalesEntryRepository salesEntryRepository;
    private final ExpenseEntryRepository expenseEntryRepository;

    public SalaryStatementDTO generateSalaryStatement(String employeeUsername,
                                                      BigDecimal incentivePercentage,
                                                      LocalDate fromDate,
                                                      LocalDate toDate,
                                                      BigDecimal baseSalary) {

        User employee = userRepository.findByUsername(employeeUsername)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        // Get sales data for the period
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);

        List<SalesEntry> salesEntries = salesEntryRepository.findBySalesRepAndDateRange(
                employeeUsername, fromDateTime, toDateTime);

        BigDecimal totalSales = salesEntries.stream()
                .map(SalesEntry::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate incentive
        BigDecimal incentiveAmount = totalSales
                .multiply(incentivePercentage)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

        // Get advances for the period
        List<ExpenseEntry> advances = expenseEntryRepository.findAdvancesByEmployeeAndDateRange(
                employeeUsername, fromDateTime, toDateTime);

        BigDecimal totalAdvances = advances.stream()
                .map(ExpenseEntry::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate net salary
        BigDecimal netSalary = baseSalary.add(incentiveAmount).subtract(totalAdvances);

        List<ExpenseEntryDTO> advanceDTOs = advances.stream()
                .map(ExpenseEntryDTO::fromEntity)
                .collect(Collectors.toList());

        return new SalaryStatementDTO(
                employee.getFullName(),
                employee.getUsername(),
                employee.getOutlet(),
                fromDate,
                toDate,
                baseSalary,
                totalSales,
                (long) salesEntries.size(),
                incentivePercentage,
                incentiveAmount,
                totalAdvances,
                netSalary,
                advanceDTOs
        );
    }
}