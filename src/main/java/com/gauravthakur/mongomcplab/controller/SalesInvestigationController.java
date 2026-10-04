package com.gauravthakur.mongomcplab.controller;

import com.gauravthakur.mongomcplab.dto.request.InvestigationRequest;
import com.gauravthakur.mongomcplab.dto.response.InvestigationResponse;
import com.gauravthakur.mongomcplab.service.AnswerHtmlSanitizer;
import com.gauravthakur.mongomcplab.service.SalesInvestigationService;

import jakarta.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Exposes the sales investigation endpoint.
 *
 * <p>
 * The controller keeps the HTTP boundary deliberately small: the question
 * is passed to the investigation service, the generated answer is sanitized
 * before it leaves the application, and the response identifies the payload
 * as HTML.
 * </p>
 *
 * @author gauravthakur
 */
@RestController
@RequestMapping("/api/v1/sales/investigations")
public class SalesInvestigationController {

        private static final Logger log = LoggerFactory.getLogger(
                        SalesInvestigationController.class);

        private final SalesInvestigationService investigationService;
        private final AnswerHtmlSanitizer htmlSanitizer;

        /**
         * Creates a controller backed by the sales investigation and HTML
         * sanitization services.
         *
         * @param investigationService service that generates an answer for a
         *                             sales question
         * @param htmlSanitizer        sanitizer used to remove unsafe generated markup
         */
        public SalesInvestigationController(
                        SalesInvestigationService investigationService,
                        AnswerHtmlSanitizer htmlSanitizer) {

                this.investigationService = investigationService;
                this.htmlSanitizer = htmlSanitizer;
        }

        /**
         * Investigates a sales question and returns a sanitized HTML answer.
         *
         * @param request validated request containing the user's question
         * @return response containing sanitized HTML and the format value
         *         {@code html}
         */
        @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
        public InvestigationResponse investigate(
                        @Valid @RequestBody InvestigationRequest request) {

                long startedAt = System.nanoTime();
                log.info("Starting sales investigation; questionLength={}",
                                request.question().length());
                String generatedAnswer = investigationService.investigate(request.question());

                String safeHtml = htmlSanitizer.sanitize(generatedAnswer);

                log.info("Completed sales investigation; answerLength={}, durationMs={}",
                                safeHtml.length(),
                                (System.nanoTime() - startedAt) / 1_000_000);
                return new InvestigationResponse(safeHtml, "html");
        }
}
