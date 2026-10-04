package com.gauravthakur.mongomcplab.exception;

import java.time.Instant;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
/**
 * Converts common HTTP and validation failures into a consistent JSON shape.
 *
 * @author gauravthakur
 */
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(
            GlobalExceptionHandler.class);

    /**
     * Handles bean-validation failures on request payloads.
     *
     * @param exception validation failure
     * @param request originating HTTP request
     * @return bad-request response containing the first validation message
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(
            MethodArgumentNotValidException exception,
            HttpServletRequest request) {

        String message = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .findFirst()
                .orElse("Request validation failed");

        log.warn("Request validation failed; path={}, message={}",
                request.getRequestURI(), message);
        return errorResponse(HttpStatus.BAD_REQUEST, message, request);
    }

    /**
     * Handles missing or malformed JSON request bodies.
     *
     * @param exception unreadable request exception
     * @param request originating HTTP request
     * @return bad-request response
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadableMessage(
            HttpMessageNotReadableException exception,
            HttpServletRequest request) {

        log.warn("Unreadable request body; path={}", request.getRequestURI());
        return errorResponse(
                HttpStatus.BAD_REQUEST,
                "Request body is missing or contains invalid JSON",
                request
        );
    }

    /**
     * Handles requests that use a media type unsupported by the endpoint.
     *
     * @param exception unsupported media type exception
     * @param request originating HTTP request
     * @return unsupported-media-type response
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleUnsupportedMediaType(
            HttpMediaTypeNotSupportedException exception,
            HttpServletRequest request) {

        log.warn("Unsupported media type; path={}", request.getRequestURI());
        return errorResponse(
                HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "Content-Type must be application/json",
                request
        );
    }

    /**
     * Handles requests that use an unsupported HTTP method.
     *
     * @param exception unsupported method exception
     * @param request originating HTTP request
     * @return method-not-allowed response
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException exception,
            HttpServletRequest request) {

        log.warn("Unsupported HTTP method; path={}", request.getRequestURI());
        return errorResponse(
                HttpStatus.METHOD_NOT_ALLOWED,
                "This HTTP method is not supported for this endpoint",
                request
        );
    }

    /**
     * Builds the standard error response body.
     *
     * @param status HTTP status to return
     * @param message client-facing error message
     * @param request originating HTTP request
     * @return response containing timestamp, status, message, and path
     */
    private ResponseEntity<Map<String, Object>> errorResponse(
            HttpStatus status,
            String message,
            HttpServletRequest request) {

        Map<String, Object> body = Map.of(
                "timestamp", Instant.now().toString(),
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "message", message,
                "path", request.getRequestURI()
        );

        return ResponseEntity.status(status).body(body);
    }
}
