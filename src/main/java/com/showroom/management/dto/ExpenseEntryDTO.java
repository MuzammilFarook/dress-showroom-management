package com.showroom.management.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.showroom.management.entity.ExpenseEntry;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseEntryDTO {
    private Long id;
    private String outlet;

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotNull(message = "Expense type is required")
    private ExpenseEntry.ExpenseType type;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    private String description;
    private String advanceToUsername;
    private String advanceToName;
    private String createdBy;
    private LocalDateTime createdAt;

    public static ExpenseEntryDTO fromEntity(ExpenseEntry expenseEntry) {
        return new ExpenseEntryDTO(
                expenseEntry.getId(),
                expenseEntry.getOutlet(),
                expenseEntry.getDate(),
                expenseEntry.getType(),
                expenseEntry.getAmount(),
                expenseEntry.getDescription(),
                expenseEntry.getAdvanceTo() != null ? expenseEntry.getAdvanceTo().getUsername() : null,
                expenseEntry.getAdvanceTo() != null ? expenseEntry.getAdvanceTo().getFullName() : null,
                expenseEntry.getCreatedBy(),
                expenseEntry.getCreatedAt()
        );
    }
}