package com.gauravthakur.mongomcplab.service;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Component;

@Component
public class AnswerHtmlSanitizer {

    private static final int MAX_HTML_LENGTH = 200_000;

    // Allow formatting and tables, with no HTML attributes.
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

    public String sanitize(String generatedHtml) {
        if (generatedHtml == null || generatedHtml.isBlank()) {
            throw new IllegalStateException(
                    "The model returned an empty answer");
        }

        if (generatedHtml.length() > MAX_HTML_LENGTH) {
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
        );

        if (Jsoup.parseBodyFragment(cleanHtml).text().isBlank()) {
            return "<p>No displayable answer was returned. "
                    + "Please rephrase the question.</p>";
        }

        return cleanHtml;
    }
}