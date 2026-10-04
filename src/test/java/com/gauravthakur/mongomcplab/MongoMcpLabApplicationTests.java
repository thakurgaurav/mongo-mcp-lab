package com.gauravthakur.mongomcplab;

import org.springframework.ai.mcp.SyncMcpToolCallbackProvider;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

/**
 * Verifies that the Spring application context loads with external MCP
 * dependencies replaced by test doubles.
 *
 * @author gauravthakur
 */
@SpringBootTest(properties = {
		"spring.ai.mcp.client.enabled=false",
		"spring.ai.openai.api-key=test"
})
class MongoMcpLabApplicationTests {

	@MockitoBean
	SyncMcpToolCallbackProvider mongoTools;

	@Test
	void contextLoads() {
	}

}
