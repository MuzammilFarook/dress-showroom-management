package com.showroom.management.controller;

import com.showroom.management.dto.*;
import com.showroom.management.entity.ExpenseEntry;
import com.showroom.management.security.UserDetailsImpl;
import com.showroom.management.service.ExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
@PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    public ResponseEntity<?> createExpenseEntry(@Valid @RequestBody ExpenseEntryDTO expenseEntryDTO,
                                                Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            ExpenseEntryDTO savedEntry = expenseService.createExpenseEntry(
                    expenseEntryDTO, userDetails.getUsername(), userDetails.getOutlet());
            return ResponseEntity.ok(new ApiResponse(true, "Expense entry created successfully", savedEntry));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<ExpenseEntryDTO>> getExpenses(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) ExpenseEntry.ExpenseType type,
            @RequestParam(required = false) String advanceToUsername,
            @RequestParam(required = false) String outlet,
            Authentication authentication) {

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        // Determine outlet scope
        String effectiveOutlet = outlet;
        if (!userDetails.getRole().name().equals("OWNER")) {
            effectiveOutlet = userDetails.getOutlet();
        } else if (effectiveOutlet == null) {
            effectiveOutlet = "All Outlets";
        }

        List<ExpenseEntryDTO> expenses = expenseService.getFilteredExpenses(
                effectiveOutlet, fromDate, toDate, type, advanceToUsername);
        return ResponseEntity.ok(expenses);
    }
}