package com.gauravthakur.mongomcplab.controller;

import com.gauravthakur.mongomcplab.dto.request.InvestigationRequest;
import com.gauravthakur.mongomcplab.dto.response.InvestigationResponse;
import com.gauravthakur.mongomcplab.service.AnswerHtmlSanitizer;
import com.gauravthakur.mongomcplab.service.SalesInvestigationService;

import jakarta.validation.Valid;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/sales/investigations")
public class SalesInvestigationController {

    private final SalesInvestigationService investigationService;
    private final AnswerHtmlSanitizer htmlSanitizer;

    public SalesInvestigationController(
            SalesInvestigationService investigationService,
            AnswerHtmlSanitizer htmlSanitizer) {

        this.investigationService = investigationService;
        this.htmlSanitizer = htmlSanitizer;
    }

    @PostMapping(
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public InvestigationResponse investigate(
            @Valid @RequestBody InvestigationRequest request) {

        String generatedAnswer =
                investigationService.investigate(request.question());

        String safeHtml = htmlSanitizer.sanitize(generatedAnswer);

        return new InvestigationResponse(safeHtml, "html");
    }
}