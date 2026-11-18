
document.addEventListener("DOMContentLoaded", () => {

    /* =====================================
       ADD EXPAND ALL / COLLAPSE ALL CONTROLS
       ===================================== */

    document.querySelectorAll("details.portfolio-disclosure")
        .forEach(section => {

            const summary = Array.from(section.children)
                .find(element => element.tagName === "SUMMARY");

            const content = Array.from(section.children)
                .find(element =>
                    element.classList.contains("disclosure-content") ||
                    element.classList.contains("contact-layout")
                );

            if (!summary || !content) {
                return;
            }

            // Only add controls where expandable content exists.
            if (!content.querySelector("details")) {
                return;
            }

            // Prevent duplicate controls.
            if (section.querySelector(":scope > .section-controls")) {
                return;
            }

            const toolbar = document.createElement("div");
            toolbar.className = "section-controls";

            const expandButton = document.createElement("button");
            expandButton.type = "button";
            expandButton.className = "section-control-button";
            expandButton.dataset.sectionAction = "expand";
            expandButton.textContent = "+ Expand all";

            const collapseButton = document.createElement("button");
            collapseButton.type = "button";
            collapseButton.className = "section-control-button";
            collapseButton.dataset.sectionAction = "collapse";
            collapseButton.textContent = "− Collapse all";

            toolbar.append(expandButton, collapseButton);

            // Place controls immediately below the section heading.
            summary.after(toolbar);
        });


    /* =====================================
       EXPAND / COLLAPSE ALL DESCENDANTS
       ===================================== */

    document.addEventListener("click", event => {

        const button = event.target.closest(
            ".section-control-button[data-section-action]"
        );

        if (!button) {
            return;
        }

        const section = button.closest("details.portfolio-disclosure");

        if (!section) {
            return;
        }

        const expand =
            button.dataset.sectionAction === "expand";

        section.querySelectorAll("details").forEach(detail => {
            detail.open = expand;
        });

    });


    /* =====================================
       NAVIGATION OPENS AND SCROLLS TO SECTION
       ===================================== */

    document.querySelectorAll(".site-navigation a[href^='#']")
        .forEach(link => {

            link.addEventListener("click", event => {

                const id = link.getAttribute("href").substring(1);
                const section = document.getElementById(id);

                if (!(section instanceof HTMLDetailsElement)) {
                    return;
                }

                event.preventDefault();

                // Open the requested main section.
                section.open = true;

                const summary = section.querySelector(":scope > summary");

                // Update the address without triggering a second scroll.
                history.replaceState(null, "", `#${id}`);

                requestAnimationFrame(() => {

                    // Scroll the section heading to the top of the content area.
                    section.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                    // Move keyboard focus to the section heading.
                    summary?.focus({ preventScroll: true });

                });

            });

        });

});
