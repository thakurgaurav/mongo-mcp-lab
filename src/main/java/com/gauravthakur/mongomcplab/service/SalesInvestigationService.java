package com.gauravthakur.mongomcplab.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.mcp.SyncMcpToolCallbackProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
/**
 * Generates sales answers using the configured chat model and MongoDB tools.
 *
 * @author gauravthakur
 */
public class SalesInvestigationService {

    private static final Logger log = LoggerFactory.getLogger(
            SalesInvestigationService.class);

    private final ChatClient chatClient;

    /**
     * Creates the chat client with the business and response-format prompts.
     *
     * @param builder chat client builder supplied by Spring AI
     * @param mongoTools MongoDB MCP tools exposed to the model
     * @param systemPrompt business instructions resource
     * @param responseFormat answer-format instructions resource
     * @throws IOException if either prompt cannot be read
     * @throws IllegalStateException if either prompt is empty
     */
    public SalesInvestigationService(
            ChatClient.Builder builder,
            SyncMcpToolCallbackProvider mongoTools,
            @Value("${app.ai.sales.system-prompt}")
            Resource systemPrompt,
            @Value("${app.ai.sales.response-format:"
                    + "classpath:prompts/sales-response-format.txt}")
            Resource responseFormat) throws IOException {

        String businessInstructions = systemPrompt.getContentAsString(
                StandardCharsets.UTF_8);

        String formattingInstructions = responseFormat.getContentAsString(
                StandardCharsets.UTF_8);

        if (businessInstructions.isBlank()) {
            throw new IllegalStateException(
                    "Sales system prompt must not be empty");
        }

        if (formattingInstructions.isBlank()) {
            throw new IllegalStateException(
                    "Sales response formatting prompt must not be empty");
        }

        String combinedInstructions =
                businessInstructions + "\n\n" + formattingInstructions;

        this.chatClient = builder
                .defaultSystem(combinedInstructions)
                .defaultTools(mongoTools)
                .build();

        log.info("Sales investigation service initialized");
    }

    /**
     * Investigates a natural-language sales question.
     *
     * @param question question to send to the model
     * @return model-generated answer content
     */
    public String investigate(String question) {
        log.debug("Calling sales investigation model; questionLength={}",
                question == null ? null : question.length());
        return chatClient
                .prompt()
                .user(question)
                .call()
                .content();
    }
}
