package com.showroom.management.controller;

import com.showroom.management.dto.*;
import com.showroom.management.service.SalaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/salary")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
@PreAuthorize("hasRole('OWNER')")
public class SalaryController {

    private final SalaryService salaryService;

    @PostMapping("/statement")
    public ResponseEntity<?> generateSalaryStatement(
            @RequestParam String employeeUsername,
            @RequestParam BigDecimal incentivePercentage,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam BigDecimal baseSalary) {

        try {
            SalaryStatementDTO statement = salaryService.generateSalaryStatement(
                    employeeUsername, incentivePercentage, fromDate, toDate, baseSalary);
            return ResponseEntity.ok(new ApiResponse(true, "Salary statement generated successfully", statement));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }
}
