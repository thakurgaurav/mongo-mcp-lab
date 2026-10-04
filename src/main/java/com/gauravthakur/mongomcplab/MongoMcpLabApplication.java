package com.gauravthakur.mongomcplab;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SpringBootApplication
/**
 * Entry point for the MongoDB MCP sales investigation application.
 *
 * @author gauravthakur
 */
public class MongoMcpLabApplication {

	private static final Logger log = LoggerFactory.getLogger(
			MongoMcpLabApplication.class);

	/**
	 * Starts the Spring Boot application.
	 *
	 * @param args command-line arguments passed to Spring Boot
	 */
	public static void main(String[] args) {
		log.info("Starting Mongo MCP Lab application");
		SpringApplication.run(MongoMcpLabApplication.class, args);
	}

}
