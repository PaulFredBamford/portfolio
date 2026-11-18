import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@12.3.0/dist/mermaid.esm.min.mjs";

mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: "base",

    themeVariables: {
        background: "#081b2d",

        primaryColor: "#123b5a",
        primaryTextColor: "#f4f8ff",
        primaryBorderColor: "#36b9e8",

        secondaryColor: "#14344e",
        secondaryTextColor: "#f4f8ff",
        secondaryBorderColor: "#389bc8",

        tertiaryColor: "#10283e",
        tertiaryTextColor: "#f4f8ff",
        tertiaryBorderColor: "#34799e",

        lineColor: "#55c5ed",
        edgeLabelBackground: "#10283e",

        clusterBkg: "#0d2941",
        clusterBorder: "#347fa5",

        titleColor: "#f4f8ff",
        fontFamily: "Segoe UI, Arial, sans-serif",
        fontSize: "18px"
    },

    flowchart: {
        htmlLabels: true,
        useMaxWidth: false,
        nodeSpacing: 55,
        rankSpacing: 65,
        curve: "basis"
    }
});


/* =========================================
   CHECK WHETHER A DIAGRAM IS HIDDEN
   ========================================= */

function isInsideClosedDetails(element) {

    let parent = element.parentElement;

    while (parent) {

        if (parent instanceof HTMLDetailsElement && !parent.open) {
            return true;
        }

        parent = parent.parentElement;
    }

    return false;
}


/* =========================================
   READ THE NATURAL SVG DIMENSIONS
   ========================================= */

function getSvgDimensions(svg) {

    const viewBox = svg.viewBox?.baseVal;

    let width = viewBox?.width || 0;
    let height = viewBox?.height || 0;

    if (width <= 0) {
        const attribute = svg.getAttribute("width");

        if (attribute && !attribute.includes("%")) {
            width = Number.parseFloat(attribute) || 0;
        }
    }

    if (height <= 0) {
        const attribute = svg.getAttribute("height");

        if (attribute && !attribute.includes("%")) {
            height = Number.parseFloat(attribute) || 0;
        }
    }

    if (width <= 0 || height <= 0) {

        const bounds = svg.getBoundingClientRect();

        width = bounds.width;
        height = bounds.height;
    }

    return { width, height };
}


/* =========================================
   CREATE A DIAGRAM'S ZOOM CONTROLS
   ========================================= */

function setupDiagramControls(panel) {

    if (panel.dataset.diagramControlsReady === "true") {
        return;
    }

    const viewport = panel.querySelector(".mermaid-scroll");
    const svg = viewport?.querySelector("svg");

    if (!viewport || !svg) {
        return;
    }

    const dimensions = getSvgDimensions(svg);

    if (dimensions.width <= 0 || dimensions.height <= 0) {
        console.warn("Unable to determine Mermaid diagram dimensions.");
        return;
    }

    const baseWidth = dimensions.width;
    const baseHeight = dimensions.height;

    /* Create a stage that can be sized independently of the SVG. */

    const stage = document.createElement("div");
    stage.className = "mermaid-stage";

    svg.parentNode.insertBefore(stage, svg);
    stage.appendChild(svg);

    let zoom = 1;

    function applyZoom(newZoom) {

        zoom = Math.max(0.1, Math.min(3, newZoom));

        const width = baseWidth * zoom;
        const height = baseHeight * zoom;

        stage.style.width = `${width}px`;
        stage.style.height = `${height}px`;

        svg.style.width = `${width}px`;
        svg.style.height = `${height}px`;
        svg.style.maxWidth = "none";

        zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
    }

    function fitToViewport() {

        const styles = getComputedStyle(viewport);

        const availableWidth =
            viewport.clientWidth -
            Number.parseFloat(styles.paddingLeft) -
            Number.parseFloat(styles.paddingRight);

        const fitZoom = Math.min(1, availableWidth / baseWidth);

        applyZoom(fitZoom);
        viewport.scrollLeft = 0;
    }

    /* Build the controls. */

    const controls = document.createElement("div");

    controls.className = "diagram-controls";
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-label", "Diagram zoom controls");

    function createButton(text, action, label) {

        const button = document.createElement("button");

        button.type = "button";
        button.className = "diagram-zoom-button";
        button.dataset.action = action;
        button.textContent = text;
        button.setAttribute("aria-label", label);
        button.title = label;

        return button;
    }

    const zoomOut = createButton("−", "zoom-out", "Zoom out");
    const zoomIn = createButton("+", "zoom-in", "Zoom in");
    const reset = createButton("100%", "reset", "Reset zoom to 100%");
    const fit = createButton("Fit", "fit", "Fit diagram to available width");

    const zoomLevel = document.createElement("span");

    zoomLevel.className = "diagram-zoom-level";
    zoomLevel.setAttribute("aria-live", "polite");

    controls.append(
        zoomOut,
        zoomLevel,
        zoomIn,
        reset,
        fit
    );

    /* Place controls between the diagram title and viewport. */

    panel.insertBefore(controls, viewport);

    controls.addEventListener("click", event => {

        const button = event.target.closest("button[data-action]");

        if (!button) {
            return;
        }

        switch (button.dataset.action) {

            case "zoom-in":
                applyZoom(zoom + 0.2);
                break;

            case "zoom-out":
                applyZoom(zoom - 0.2);
                break;

            case "reset":
                applyZoom(1);
                viewport.scrollLeft = 0;
                break;

            case "fit":
                fitToViewport();
                break;
        }
    });

    /* Start at natural size, preserving detail. */

    applyZoom(1);

    panel.dataset.diagramControlsReady = "true";
}


/* =========================================
   INITIALISE CONTROLS FOR RENDERED DIAGRAMS
   ========================================= */

function setupAllDiagramControls() {

    document.querySelectorAll(".diagram-panel").forEach(panel => {
        setupDiagramControls(panel);
    });
}


/* =========================================
   RENDER VISIBLE DIAGRAMS
   ========================================= */

async function renderVisibleDiagrams() {

    const diagrams = Array.from(
        document.querySelectorAll(
            "pre.mermaid:not([data-mermaid-rendered='true'])"
        )
    ).filter(element => !isInsideClosedDetails(element));

    if (diagrams.length === 0) {
        setupAllDiagramControls();
        return;
    }

    diagrams.forEach(element => {
        element.dataset.mermaidRendered = "true";
    });

    try {

        await mermaid.run({
            nodes: diagrams
        });

        setupAllDiagramControls();

    } catch (error) {

        diagrams.forEach(element => {
            delete element.dataset.mermaidRendered;
        });

        console.error("Mermaid diagram rendering failed:", error);
    }
}


/* =========================================
   RENDER WHEN COLLAPSIBLE SECTIONS OPEN
   ========================================= */

document.querySelectorAll("details").forEach(details => {

    details.addEventListener("toggle", () => {

        if (details.open) {
            renderVisibleDiagrams();
        }

    });

});


/* =========================================
   INITIAL PAGE LOAD
   ========================================= */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        renderVisibleDiagrams,
        { once: true }
    );

} else {

    renderVisibleDiagrams();

}