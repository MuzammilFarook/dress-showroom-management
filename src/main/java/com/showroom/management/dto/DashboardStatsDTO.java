package com.showroom.management.dto;

import lombok.Data;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class DashboardStatsDTO {
    private BigDecimal totalSales;
    private BigDecimal totalExpenses;
    private BigDecimal netProfit;
    private Long totalTransactions;
}