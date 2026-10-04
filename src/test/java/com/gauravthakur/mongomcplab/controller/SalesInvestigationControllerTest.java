package com.gauravthakur.mongomcplab.controller;

import com.gauravthakur.mongomcplab.dto.request.InvestigationRequest;
import com.gauravthakur.mongomcplab.dto.response.InvestigationResponse;
import com.gauravthakur.mongomcplab.service.AnswerHtmlSanitizer;
import com.gauravthakur.mongomcplab.service.SalesInvestigationService;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.mock;

/**
 * Unit tests for the sales investigation controller.
 *
 * @author gauravthakur
 */
class SalesInvestigationControllerTest {

    private final SalesInvestigationService investigationService =
            mock(SalesInvestigationService.class);
    private final AnswerHtmlSanitizer htmlSanitizer =
            mock(AnswerHtmlSanitizer.class);
    private final SalesInvestigationController controller =
            new SalesInvestigationController(investigationService, htmlSanitizer);

    @Test
    void investigatesQuestionSanitizesAnswerAndReturnsHtmlResponse() {
        InvestigationRequest request = new InvestigationRequest("Which products are underperforming?");
        String generatedAnswer = "<p>Raw answer</p><script>unsafe()</script>";
        String sanitizedAnswer = "<p>Raw answer</p>";

        when(investigationService.investigate(request.question()))
                .thenReturn(generatedAnswer);
        when(htmlSanitizer.sanitize(generatedAnswer)).thenReturn(sanitizedAnswer);

        InvestigationResponse response = controller.investigate(request);

        assertEquals(sanitizedAnswer, response.answer());
        assertEquals("html", response.format());
        verify(investigationService).investigate(request.question());
        verify(htmlSanitizer).sanitize(generatedAnswer);
        verifyNoMoreInteractions(investigationService, htmlSanitizer);
    }

    @Test
    void propagatesInvestigationFailureWithoutSanitizing() {
        InvestigationRequest request = new InvestigationRequest("Show returned orders");
        RuntimeException failure = new RuntimeException("investigation failed");
        when(investigationService.investigate(request.question())).thenThrow(failure);

        RuntimeException thrown = org.junit.jupiter.api.Assertions.assertThrows(
                RuntimeException.class, () -> controller.investigate(request));

        assertEquals(failure, thrown);
        verify(investigationService).investigate(request.question());
        verifyNoMoreInteractions(investigationService, htmlSanitizer);
    }
}
