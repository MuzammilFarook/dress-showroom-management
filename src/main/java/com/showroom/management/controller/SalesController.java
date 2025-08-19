package com.showroom.management.controller;

import com.showroom.management.dto.*;
import com.showroom.management.entity.SalesEntry;
import com.showroom.management.security.UserDetailsImpl;
import com.showroom.management.service.SalesService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class SalesController {

    private final SalesService salesService;

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<?> createSalesEntry(@Valid @RequestBody SalesEntryDTO salesEntryDTO,
                                              Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            SalesEntryDTO savedEntry = salesService.createSalesEntry(salesEntryDTO, userDetails.getUsername());
            return ResponseEntity.ok(new ApiResponse(true, "Sales entry created successfully", savedEntry));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<SalesEntryDTO>> getSales(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(required = false) String salesRepUsername,
            @RequestParam(required = false) SalesEntry.PaymentType paymentType,
            @RequestParam(required = false) String outlet,
            Authentication authentication) {

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        // Determine the outlet scope based on user role
        String effectiveOutlet = outlet;
        if (userDetails.getRole().name().equals("SALES")) {
            // Sales rep can only see their own data
            List<SalesEntryDTO> sales = salesService.getSalesForUser(
                    userDetails.getUsername(),
                    userDetails.getRole().name(),
                    userDetails.getOutlet(),
                    fromDate,
                    toDate
            );
            return ResponseEntity.ok(sales);
        } else if (!userDetails.getRole().name().equals("OWNER")) {
            // Manager can only see their outlet
            effectiveOutlet = userDetails.getOutlet();
        } else if (effectiveOutlet == null) {
            // Owner with no specific outlet filter
            effectiveOutlet = "All Outlets";
        }

        List<SalesEntryDTO> sales = salesService.getFilteredSales(
                effectiveOutlet, fromDate, toDate, salesRepUsername, paymentType);
        return ResponseEntity.ok(sales);
    }

    @GetMapping("/dashboard-stats")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(required = false) String outlet,
            Authentication authentication) {

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String userRole = userDetails.getRole().name();
        String username = userDetails.getUsername();

        DashboardStatsDTO stats;

        if ("SALES".equals(userRole)) {
            // Sales rep sees only their own data
            stats = salesService.getDashboardStatsForSalesRep(username, fromDate, toDate);
        } else {
            // Manager/Owner logic (existing)
            String effectiveOutlet = outlet;
            if (!"OWNER".equals(userRole)) {
                effectiveOutlet = userDetails.getOutlet();
            } else if (effectiveOutlet == null) {
                effectiveOutlet = "All Outlets";
            }

            stats = salesService.getDashboardStats(effectiveOutlet, fromDate, toDate);
        }

        return ResponseEntity.ok(stats);
    }
}