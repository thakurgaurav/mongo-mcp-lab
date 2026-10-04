package com.gauravthakur.mongomcplab.dto.response;

/**
 * Response payload returned by the sales investigation endpoint.
 *
 * @param answer sanitized answer content
 * @param format representation of the answer; currently {@code html}
 * @author gauravthakur
 */
public record InvestigationResponse(
        String answer,
        String format
) {
}
