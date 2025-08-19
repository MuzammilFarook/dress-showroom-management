package com.showroom.management.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.showroom.management.entity.SalesEntry;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SalesEntryDTO {
    private Long id;

    @NotBlank(message = "Sales representative is required")
    private String salesRepUsername;

    private String salesRepName;
    private String outlet;

    @NotNull(message = "Date and time is required")
    private LocalDateTime dateTime;

    @NotBlank(message = "Bill number is required")
    private String billNumber;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    @NotNull(message = "Payment type is required")
    private SalesEntry.PaymentType paymentType;

    private String createdBy;
    private LocalDateTime createdAt;

    public static SalesEntryDTO fromEntity(SalesEntry salesEntry) {
        return new SalesEntryDTO(
                salesEntry.getId(),
                salesEntry.getSalesRep().getUsername(),
                salesEntry.getSalesRep().getFullName(),
                salesEntry.getOutlet(),
                salesEntry.getDateTime(),
                salesEntry.getBillNumber(),
                salesEntry.getAmount(),
                salesEntry.getPaymentType(),
                salesEntry.getCreatedBy(),
                salesEntry.getCreatedAt()
        );
    }
}