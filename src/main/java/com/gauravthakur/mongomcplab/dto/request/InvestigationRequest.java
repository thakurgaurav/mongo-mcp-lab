package com.gauravthakur.mongomcplab.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload for a sales investigation.
 *
 * @param question natural-language sales question to investigate
 * @author gauravthakur
 */
public record InvestigationRequest(

        @NotBlank(message = "Question must not be blank")
        @Size(max = 4000, message = "Question must not exceed 4000 characters")
        String question

) {
}
