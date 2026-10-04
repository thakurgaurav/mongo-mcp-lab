package com.gauravthakur.mongomcplab.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.mcp.SyncMcpToolCallbackProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

@Service
public class SalesInvestigationService {

    private final ChatClient chatClient;

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
    }

    public String investigate(String question) {
        return chatClient
                .prompt()
                .user(question)
                .call()
                .content();
    }
}