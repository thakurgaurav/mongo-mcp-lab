"use strict";

const API_URL = "/api/v1/sales/investigations";
const REQUEST_TIMEOUT_MS = 180_000;

const form = document.querySelector("#question-form");
const questionInput = document.querySelector("#question");
const sendButton = document.querySelector("#send-button");
const clearButton = document.querySelector("#clear-chat");
const conversation = document.querySelector("#conversation");
const welcome = document.querySelector("#welcome");
const status = document.querySelector("#status");
const characterCount = document.querySelector("#character-count");
const suggestionButtons = document.querySelectorAll("[data-question]");

let busy = false;

function element(tag, className, text) {
    const node = document.createElement(tag);

    if (className) {
        node.className = className;
    }

    if (text !== undefined) {
        node.textContent = text;
    }

    return node;
}

function scrollToLatest() {
    conversation.scrollTop = conversation.scrollHeight;
}

function updateCharacterCount() {
    characterCount.textContent =
        `${questionInput.value.length.toLocaleString("en-US")} / 4,000`;
}

function setBusy(value) {
    busy = value;
    sendButton.disabled = value;
    clearButton.disabled = value;
    questionInput.readOnly = value;
    conversation.setAttribute("aria-busy", String(value));

    suggestionButtons.forEach(button => {
        button.disabled = value;
    });
}

function createMessage(role, label) {
    welcome.hidden = true;

    const message = element("article", `message ${role}`);
    const header = element("div", "message-header");
    header.append(element("span", "", label));

    message.append(header);
    conversation.append(message);

    return { message, header };
}

function showQuestion(question) {
    const { message } = createMessage("user", "YOU");

    // User input is always inserted as text.
    message.append(element("div", "question-text", question));
    scrollToLatest();
}

function showAnswer(body) {
    const { message, header } =
        createMessage("assistant", "SALES INVESTIGATOR");

    const card = element("div", "answer-card");
    const content = element("div", "answer-content");

    if (body.format === "html") {
        /*
         * This endpoint sanitizes answer with AnswerHtmlSanitizer
         * before marking the response as HTML.
         *
         * Never use this branch for raw model output or other sources.
         */
        content.innerHTML = body.answer;
    } else {
        content.classList.add("plain-answer");
        content.textContent = body.answer;
    }

    card.append(content);
    message.append(card);

    // Capture the answer before adding chart controls.
    const copyText = content.innerText;
    const copyButton = element("button", "copy-button", "Copy answer");
    copyButton.type = "button";

    copyButton.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(copyText);
            copyButton.textContent = "Copied";
        } catch {
            copyButton.textContent = "Select the answer to copy";
        }

        setTimeout(() => {
            copyButton.textContent = "Copy answer";
        }, 2500);
    });

    header.append(copyButton);

    content.querySelectorAll("table").forEach(table => {
        const wrapper = element("div", "table-scroll");
        wrapper.tabIndex = 0;
        wrapper.setAttribute("role", "region");
        wrapper.setAttribute(
            "aria-label",
            table.caption?.textContent.trim() || "Results table"
        );

        table.before(wrapper);
        wrapper.append(table);

        addChartControls(table, wrapper);
    });

    scrollToLatest();
}

function showError(messageText, question) {
    const { message } = createMessage("assistant", "REQUEST UPDATE");
    const card = element("div", "error-card");
    const restoreButton = element(
        "button",
        "secondary",
        "Restore question"
    );

    restoreButton.type = "button";
    restoreButton.addEventListener("click", () => {
        if (busy) {
            return;
        }

        questionInput.value = question;
        updateCharacterCount();
        questionInput.focus();
    });

    card.append(element("p", "", messageText), restoreButton);
    message.append(card);
    scrollToLatest();
}

/*
 * Parse a numeric table cell conservatively.
 * Missing values remain null; they are never treated as zero.
 */
function parseNumericCell(text) {
    let value = text.trim().replace(/\u2212/g, "-");

    if (/^(?:|N\/A|NA|null|—|–|-)$/i.test(value)) {
        return { value: null, unit: "", display: text.trim() || "N/A" };
    }

    let parenthesized = false;

    if (value.startsWith("(") && value.endsWith(")")) {
        parenthesized = true;
        value = value.slice(1, -1).trim();
    }

    const match = value.match(
        /^([+-]?)(\$?)([+-]?)((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)(%?)$/
    );

    if (!match) {
        return null;
    }

    const [, firstSign, dollar, secondSign, digits, percent] = match;

    if (
        (firstSign && secondSign) ||
        (dollar && percent) ||
        (parenthesized && (firstSign || secondSign))
    ) {
        return null;
    }

    const negative =
        parenthesized || firstSign === "-" || secondSign === "-";

    const number = Number(digits.replace(/,/g, "")) *
        (negative ? -1 : 1);

    if (!Number.isFinite(number)) {
        return null;
    }

    return {
        value: number,
        unit: dollar ? "USD" : percent ? "%" : "",
        display: text.trim()
    };
}

function getChartData(table) {
    // Charts require a simple table with one header row.
    if (
        table.querySelector("table") ||
        !table.tHead ||
        table.tHead.rows.length !== 1
    ) {
        return null;
    }

    const headers = Array.from(
        table.tHead.rows[0].cells,
        cell => cell.textContent.trim()
    );

    const rows = Array.from(table.tBodies)
        .flatMap(body => Array.from(body.rows));

    // Footer totals are intentionally excluded.
    if (
        headers.length < 2 ||
        rows.length < 2 ||
        rows.length > 20 ||
        rows.some(row => row.cells.length !== headers.length)
    ) {
        return null;
    }

    const labels = rows.map(row => row.cells[0].textContent.trim());

    if (labels.some(label => !label)) {
        return null;
    }

    const columns = [];

    for (let index = 1; index < headers.length; index++) {
        const cells = rows.map(row =>
            parseNumericCell(row.cells[index].textContent)
        );

        // Exclude columns containing prose or ambiguous number formats.
        if (cells.some(cell => cell === null)) {
            continue;
        }

        const populated = cells.filter(cell => cell.value !== null);

        if (populated.length < 2) {
            continue;
        }

        // Do not mix dollars, percentages, and plain numbers.
        const units = new Set(populated.map(cell => cell.unit));

        if (units.size !== 1) {
            continue;
        }

        columns.push({
            title: headers[index] || `Column ${index + 1}`,
            cells
        });
    }

    return columns.length ? { labels, columns } : null;
}

function fitCanvasText(context, text, maxWidth) {
    let result = String(text);

    if (context.measureText(result).width <= maxWidth) {
        return result;
    }

    while (
        result.length > 0 &&
        context.measureText(`${result}…`).width > maxWidth
    ) {
        result = result.slice(0, -1);
    }

    return `${result}…`;
}

function drawBarChart(canvas, labels, column) {
    const width = 900;
    const rowHeight = 40;
    const height = 80 + labels.length * rowHeight;
    const resolution = 2;

    canvas.width = width * resolution;
    canvas.height = height * resolution;

    const context = canvas.getContext("2d");

    if (!context) {
        canvas.hidden = true;
        return;
    }

    context.scale(resolution, resolution);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);

    const numbers = column.cells
        .filter(cell => cell.value !== null)
        .map(cell => cell.value);

    // Normalize before calculating the range to avoid overflow.
    const magnitude = Math.max(1, ...numbers.map(Math.abs));
    const normalized = numbers.map(value => value / magnitude);

    let minimum = Math.min(0, ...normalized);
    let maximum = Math.max(0, ...normalized);

    if (minimum === maximum) {
        maximum = minimum + 1;
    }

    const plotLeft = 230;
    const plotRight = 700;
    const plotWidth = plotRight - plotLeft;

    function xPosition(value) {
        return plotLeft +
            ((value / magnitude - minimum) / (maximum - minimum)) *
            plotWidth;
    }

    const zeroX = xPosition(0);

    context.font = "600 16px system-ui";
    context.fillStyle = "#102a43";
    context.fillText(
        fitCanvasText(context, column.title, width - 40),
        20,
        26
    );

    context.strokeStyle = "#c8dce8";
    context.beginPath();
    context.moveTo(zeroX, 42);
    context.lineTo(zeroX, height - 28);
    context.stroke();

    labels.forEach((label, index) => {
        const y = 62 + index * rowHeight;
        const cell = column.cells[index];

        context.font = "13px system-ui";
        context.fillStyle = "#536b82";
        context.textAlign = "left";
        context.fillText(
            fitCanvasText(context, label, plotLeft - 35),
            16,
            y
        );

        if (cell.value !== null) {
            const valueX = xPosition(cell.value);

            context.fillStyle =
                cell.value < 0 ? "#1479b8" : "#19afc1";

            context.fillRect(
                Math.min(zeroX, valueX),
                y - 15,
                Math.abs(valueX - zeroX),
                23
            );
        }

        context.fillStyle = "#102a43";
        context.textAlign = "right";
        context.fillText(
            fitCanvasText(context, cell.display, 165),
            width - 16,
            y
        );
    });

    context.textAlign = "center";
    context.font = "11px system-ui";
    context.fillStyle = "#536b82";
    context.fillText("0", zeroX, height - 10);

    canvas.setAttribute(
        "aria-label",
        `Bar chart of ${column.title}. Exact values are in the preceding table.`
    );
}

function addChartControls(table, wrapper) {
    const data = getChartData(table);

    if (!data) {
        return;
    }

    const panel = element("div", "chart-panel");
    const controls = element("div", "chart-controls");
    const label = element("label", "", "Chart metric ");
    const select = document.createElement("select");
    const toggleButton = element("button", "", "Show chart");
    const canvas = document.createElement("canvas");
    const note = element(
        "p",
        "chart-note",
        "Bars use the displayed table values. Missing values have no bar. " +
        "Charts do not independently verify the answer."
    );

    toggleButton.type = "button";
    toggleButton.setAttribute("aria-expanded", "false");

    canvas.hidden = true;
    canvas.setAttribute("role", "img");
    note.hidden = true;

    data.columns.forEach((column, index) => {
        const option = element("option", "", column.title);
        option.value = String(index);
        select.append(option);
    });

    function redraw() {
        drawBarChart(
            canvas,
            data.labels,
            data.columns[Number(select.value)]
        );
    }

    toggleButton.addEventListener("click", () => {
        const show = canvas.hidden;

        canvas.hidden = !show;
        note.hidden = !show;
        toggleButton.textContent = show ? "Hide chart" : "Show chart";
        toggleButton.setAttribute("aria-expanded", String(show));

        if (show) {
            redraw();
        }
    });

    select.addEventListener("change", () => {
        if (!canvas.hidden) {
            redraw();
        }
    });

    label.append(select);
    controls.append(label, toggleButton);
    panel.append(controls, note, canvas);
    wrapper.after(panel);
}

async function submitQuestion(event) {
    event.preventDefault();

    if (busy) {
        return;
    }

    const question = questionInput.value.trim();

    if (!question || question.length > 4000) {
        status.textContent = "Enter a question between 1 and 4,000 characters.";
        questionInput.focus();
        return;
    }

    setBusy(true);
    showQuestion(question);

    questionInput.value = "";
    updateCharacterCount();

    const startedAt = Date.now();
    const abortController = new AbortController();

    status.textContent = "Investigating your question…";

    const progressTimer = setInterval(() => {
        const seconds = Math.floor((Date.now() - startedAt) / 1000);
        status.textContent = `Investigating your question… ${seconds}s`;
    }, 1000);

    const timeoutTimer = setTimeout(() => {
        abortController.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ question }),
            signal: abortController.signal
        });

        const body = await response.json().catch(() => null);

        if (!response.ok) {
            const validationMessage =
                response.status < 500 &&
                typeof body?.message === "string"
                    ? body.message.slice(0, 500)
                    : null;

            throw new Error(
                validationMessage ||
                `The investigation could not finish (HTTP ${response.status}). ` +
                "Check the application logs for details."
            );
        }

        if (typeof body?.answer !== "string" || !body.answer.trim()) {
            throw new Error("The server returned an empty or unreadable answer.");
        }

        if (body.answer.length > 200_000) {
            throw new Error("The answer is too large to display.");
        }

        showAnswer(body);

        const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
        status.textContent = `Completed in ${elapsed}s.`;
    } catch (error) {
        let message;

        if (error.name === "AbortError") {
            message =
                "The browser stopped waiting after three minutes. " +
                "The server may still be processing this request. " +
                "Check the application logs before submitting it again.";
        } else if (error instanceof TypeError) {
            message =
                "Could not reach the application. Check that Spring Boot " +
                "is running and your connection is available.";
        } else {
            message = error.message || "The request could not be completed.";
        }

        showError(message, question);
        status.textContent = "The investigation did not complete in this page.";
    } finally {
        clearInterval(progressTimer);
        clearTimeout(timeoutTimer);
        setBusy(false);
        questionInput.focus();
    }
}

form.addEventListener("submit", submitQuestion);

questionInput.addEventListener("input", updateCharacterCount);

questionInput.addEventListener("keydown", event => {
    if (
        event.key === "Enter" &&
        (event.ctrlKey || event.metaKey) &&
        !busy
    ) {
        event.preventDefault();
        form.requestSubmit();
    }
});

suggestionButtons.forEach(button => {
    button.addEventListener("click", () => {
        if (busy) {
            return;
        }

        // Suggestions populate the input; they do not send a request.
        questionInput.value = button.dataset.question || "";
        updateCharacterCount();
        questionInput.focus();
    });
});

clearButton.addEventListener("click", () => {
    if (busy) {
        return;
    }

    conversation.replaceChildren(welcome);
    welcome.hidden = false;
    status.textContent = "";
    questionInput.value = "";
    updateCharacterCount();
    questionInput.focus();
});

updateCharacterCount();
