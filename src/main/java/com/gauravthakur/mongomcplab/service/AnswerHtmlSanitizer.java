package com.gauravthakur.mongomcplab.service;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.safety.Safelist;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
/**
 * Removes unsafe markup from model-generated answers before HTML display.
 *
 * @author gauravthakur
 */
public class AnswerHtmlSanitizer {

    private static final Logger log = LoggerFactory.getLogger(
            AnswerHtmlSanitizer.class);

    private static final int MAX_HTML_LENGTH = 200_000;

    /** Allow formatting and tables, with no HTML attributes. */
    private static final Safelist DISPLAY_ONLY = new Safelist()
            .addTags(
                    "p", "br",
                    "h2", "h3", "h4",
                    "strong", "b", "em", "i",
                    "ul", "ol", "li",
                    "blockquote", "pre", "code", "hr",
                    "table", "caption", "thead", "tbody", "tfoot",
                    "tr", "th", "td"
            );

    /**
     * Sanitizes generated HTML while enforcing the display size limit.
     *
     * @param generatedHtml raw answer returned by the model
     * @return safe display-only HTML
     * @throws IllegalStateException if the answer is empty or too large
     */
    public String sanitize(String generatedHtml) {
        log.debug("Sanitizing generated answer; inputLength={}",
                generatedHtml == null ? null : generatedHtml.length());
        if (generatedHtml == null || generatedHtml.isBlank()) {
            log.warn("Rejected empty generated answer");
            throw new IllegalStateException(
                    "The model returned an empty answer");
        }

        if (generatedHtml.length() > MAX_HTML_LENGTH) {
            log.warn("Rejected oversized generated answer; inputLength={}",
                    generatedHtml.length());
            throw new IllegalStateException(
                    "The model answer exceeded the display limit");
        }

        Document document = Jsoup.parseBodyFragment(generatedHtml);

        // Remove these elements together with their contents.
        document.select(
                "script, style, iframe, object, embed, "
                        + "form, input, button, textarea, select, option, "
                        + "img, picture, video, audio, source, "
                        + "svg, math, template, noscript, link, meta, base"
        ).remove();

        // Keep link labels as ordinary text; remove the links themselves.
        document.select("a").unwrap();

        String cleanHtml = Jsoup.clean(
                document.body().html(),
                "",
                DISPLAY_ONLY,
                new Document.OutputSettings().prettyPrint(false)
        ).trim();

        if (Jsoup.parseBodyFragment(cleanHtml).text().isBlank()) {
            log.warn("Generated answer contained no displayable text");
            return "<p>No displayable answer was returned. "
                    + "Please rephrase the question.</p>";
        }

        log.debug("Sanitized generated answer; outputLength={}",
                cleanHtml.length());
        return cleanHtml;
    }
}
