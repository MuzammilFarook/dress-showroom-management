package com.showroom.management.dto;

import lombok.Data;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
public class SalaryStatementDTO {
    private String employeeName;
    private String employeeUsername;
    private String outlet;
    private LocalDate fromDate;
    private LocalDate toDate;
    private BigDecimal baseSalary;
    private BigDecimal totalSales;
    private Long transactionCount;
    private BigDecimal incentivePercentage;
    private BigDecimal incentiveAmount;
    private BigDecimal totalAdvances;
    private BigDecimal netSalary;
    private List<ExpenseEntryDTO> advances;
}
