package com.showroom.management.service;

import com.showroom.management.dto.*;
import com.showroom.management.entity.ExpenseEntry;
import com.showroom.management.entity.User;
import com.showroom.management.repository.ExpenseEntryRepository;
import com.showroom.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ExpenseService {

    private final ExpenseEntryRepository expenseEntryRepository;
    private final UserRepository userRepository;

    public ExpenseEntryDTO createExpenseEntry(ExpenseEntryDTO dto, String createdBy, String userOutlet) {
        ExpenseEntry expenseEntry = new ExpenseEntry();
        expenseEntry.setOutlet(userOutlet.equals("All Outlets") ? "Outlet 1" : userOutlet);
        expenseEntry.setDate(dto.getDate());
        expenseEntry.setType(dto.getType());
        expenseEntry.setAmount(dto.getAmount());
        expenseEntry.setDescription(dto.getDescription());
        expenseEntry.setCreatedBy(createdBy);

        if (dto.getAdvanceToUsername() != null && !dto.getAdvanceToUsername().isEmpty()) {
            User advanceTo = userRepository.findByUsername(dto.getAdvanceToUsername())
                    .orElseThrow(() -> new RuntimeException("Advance recipient not found"));
            expenseEntry.setAdvanceTo(advanceTo);
        }

        ExpenseEntry saved = expenseEntryRepository.save(expenseEntry);
        return ExpenseEntryDTO.fromEntity(saved);
    }

    public List<ExpenseEntryDTO> getFilteredExpenses(String outlet, LocalDate fromDate,
                                                     LocalDate toDate, ExpenseEntry.ExpenseType type,
                                                     String advanceToUsername) {

        // Convert parameters to safe values
        String safeOutlet = (outlet == null || outlet.trim().isEmpty()) ? "All Outlets" : outlet;
        LocalDate safeFromDate = (fromDate == null) ? LocalDate.of(1900, 1, 1) : fromDate;
        LocalDate safeToDate = (toDate == null) ? LocalDate.of(2099, 12, 31) : toDate;

        // Handle advance to user
        Long advanceToId = null;
        if (advanceToUsername != null && !advanceToUsername.trim().isEmpty()) {
            User advanceTo = userRepository.findByUsername(advanceToUsername).orElse(null);
            if (advanceTo != null) {
                advanceToId = advanceTo.getId();
            }
        }

        // Handle expense type
        String typeStr = (type != null) ? type.name() : null;

        List<ExpenseEntry> expenses = expenseEntryRepository.findFilteredExpensesNative(
                safeOutlet, safeFromDate, safeToDate, typeStr, advanceToId);

        return expenses.stream()
                .map(ExpenseEntryDTO::fromEntity)
                .collect(Collectors.toList());
    }

//    public BigDecimal getTotalExpenses(String outlet, LocalDate fromDate, LocalDate toDate) {
//        // Convert parameters to safe values
//        String safeOutlet = (outlet == null || outlet.trim().isEmpty()) ? "All Outlets" : outlet;
//        LocalDate safeFromDate = (fromDate == null) ? LocalDate.of(1900, 1, 1) : fromDate;
//        LocalDate safeToDate = (toDate == null) ? LocalDate.of(2099, 12, 31) : toDate;
//
//        BigDecimal total = expenseEntryRepository.getTotalExpenses(safeOutlet, safeFromDate, safeToDate);
//        return total != null ? total : BigDecimal.ZERO;
//    }
}