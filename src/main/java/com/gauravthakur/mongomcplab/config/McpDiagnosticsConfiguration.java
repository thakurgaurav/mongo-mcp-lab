package com.gauravthakur.mongomcplab.config;

import io.modelcontextprotocol.client.McpSyncClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import io.modelcontextprotocol.spec.McpSchema;
import java.util.Map;

import java.util.List;

@Configuration
public class McpDiagnosticsConfiguration {

    private static final Logger log = LoggerFactory.getLogger(McpDiagnosticsConfiguration.class);

    @Bean
    ApplicationRunner listMcpTools(List<McpSyncClient> clients) {
        return args -> {
            for (McpSyncClient client : clients) {

                var request = McpSchema.CallToolRequest.builder("list-collections")
                        .arguments(Map.of(
                                "connectionId", "preconfigured",
                                "database", "sales_lab"))
                        .build();

                var collectionsResult = client.callTool(request);

                log.info("list-collections error: {}", collectionsResult.isError());
                log.info("list-collections result: {}", collectionsResult.content());

                
                var result = client.listTools();

                for (var tool : result.tools()) {
                    log.info("MCP tool: {} — {}",
                            tool.name(), tool.description());

                    if ("list-collections".equals(tool.name())) {
                        log.info("list-collections input schema: {}", tool.inputSchema());
                    }
                }
            }
        };
    }
}