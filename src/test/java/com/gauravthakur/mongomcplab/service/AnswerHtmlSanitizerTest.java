package com.gauravthakur.mongomcplab.service;

import org.jsoup.Jsoup;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit tests for model-answer HTML sanitization.
 *
 * @author gauravthakur
 */
class AnswerHtmlSanitizerTest {

    private final AnswerHtmlSanitizer sanitizer = new AnswerHtmlSanitizer();

    @Test
    void rejectsNullAndBlankInput() {
        IllegalStateException nullException = assertThrows(
                IllegalStateException.class, () -> sanitizer.sanitize(null));
        IllegalStateException blankException = assertThrows(
                IllegalStateException.class, () -> sanitizer.sanitize(" \n\t"));

        assertEquals("The model returned an empty answer", nullException.getMessage());
        assertEquals("The model returned an empty answer", blankException.getMessage());
    }

    @Test
    void rejectsInputLongerThanDisplayLimit() {
        String oversized = "x".repeat(200_001);

        IllegalStateException exception = assertThrows(
                IllegalStateException.class, () -> sanitizer.sanitize(oversized));

        assertEquals("The model answer exceeded the display limit", exception.getMessage());
    }

    @Test
    void preservesAllowedFormattingAndTables() {
        String result = sanitizer.sanitize(
                "<h2>Summary</h2><p><strong>Important</strong> and <em>useful</em></p>"
                        + "<ul><li>First</li></ul><table><tr><th>Count</th></tr>"
                        + "<tr><td>2</td></tr></table>");

        assertTrue(result.contains("<h2>Summary</h2>"));
        assertTrue(result.contains("<strong>Important</strong>"));
        assertTrue(result.contains("<em>useful</em>"));
        assertTrue(result.contains("<ul>"));
        assertTrue(result.contains("<li>First</li>"));
        assertTrue(result.contains("</ul>"));
        org.jsoup.nodes.Document document = Jsoup.parseBodyFragment(result);
        assertEquals(1, document.select("table").size());
        assertEquals("Count", document.select("th").text());
        assertEquals("2", document.select("td").text());
    }

    @Test
    void removesUnsafeElementsAndAttributesButKeepsTheirSafeText() {
        String result = sanitizer.sanitize(
                "<p onclick='run()'>Hello <a href='javascript:run()'>there</a></p>"
                        + "<script>alert(1)</script><iframe>frame text</iframe>"
                        + "<img src='x' onerror='run()'><svg><text>svg text</text></svg>");

        assertEquals("<p>Hello there</p>", result);
        assertFalse(result.contains("onclick"));
        assertFalse(result.contains("javascript:"));
        assertFalse(result.contains("alert(1)"));
        assertFalse(result.contains("frame text"));
        assertFalse(result.contains("svg text"));
        assertFalse(result.contains("<img"));
    }

    @Test
    void stripsUnknownTagsAndDiscardsLinkAttributes() {
        String result = sanitizer.sanitize(
                "<div class='x'>Before <a href='https://example.com' target='_blank'>link</a>"
                        + " <custom>after</custom></div>");

        assertEquals("Before link after", result);
        assertFalse(result.contains("href"));
        assertFalse(result.contains("class="));
    }

    @Test
    void returnsFallbackWhenInputHasNoDisplayableText() {
        assertEquals(
                "<p>No displayable answer was returned. Please rephrase the question.</p>",
                sanitizer.sanitize("<script>alert(1)</script><img src='x'>"));
    }

    @Test
    void acceptsInputAtDisplayLimit() {
        String input = "x".repeat(200_000);

        assertEquals(input, sanitizer.sanitize(input));
    }

    @Test
    void returnsValidHtml() {
        String result = sanitizer.sanitize("<p>safe</p>");

        assertEquals("safe", Jsoup.parseBodyFragment(result).text());
    }
}
