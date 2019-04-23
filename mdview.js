// mdview.js
// Copyright (C) 2018 Kaz Nishimura
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.
//
// SPDX-License-Identifier: MIT

// This file is a module script.

/**
 * Client-side Markdown viewer.
 *
 * @module mdview
 */

import { DOMRenderer } from "./mdtodom.js";

function loadPage(container, path) {
    // Measuring timings.
    if ("gtag" in self && "performance" in self) {
        gtag("event", "timing_complete", {
            "name": "mdview_begin",
            "value": Math.floor(performance.now()),
        });
    }

    if (path == null) {
        path = container.dataset.welcomePage;
        if (path == null) {
            path = "welcome.md";
        }
    }

    return fetch(path, {
        mode: "same-origin",
        headers: {
            "Accept": "text/*",
        },
    }).then((response) => {
        if (response.ok) {
            return response.text();
        }
        return "# " + response.status + " " + response.statusText + "\n";
    }).then((text) => {
        let parser = new commonmark.Parser();
        let tree = parser.parse(text);

        while (container.hasChildNodes()) {
            container.removeChild(container.lastChild);
        }

        let renderer = new DOMRenderer(document);
        renderer.render(tree, container);

        // Measuring timings.
        if ("gtag" in self && "performance" in self) {
            gtag("event", "timing_complete", {
                "name": "mdview_end",
                "value": Math.floor(performance.now()),
            });
        }
    }).catch((reason) => {
        throw new Error(reason);
    });
}

/**
 * Wait for a script to be loaded.
 *
 * @param {string} propertyName property name to check whether the script has
 * been loaded or not
 * @param {Node} node a DOM node to listen a "load" event
 */
function waitForScriptLoaded(propertyName, node)
{
    return new Promise((resolve) => {
        if (propertyName in self) {
            resolve();
        }
        else {
            node.addEventListener("load", function () {
                resolve();
            });
        }
    });
}

function sleep(millis)
{
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, millis);
    });
}

let container = document.getElementById("mdview");
if (container != null) {
    let path = null;
    if (location.search.startsWith("?")) {
        path = location.search.substring(1);
        if (path.startsWith("view=")) {
            path = path.substring(5);
        }
        if (path.startsWith(".") || path.indexOf("/.") >= 0) {
            path = null;
        }
    }

    let node = document.getElementById("commonmark-script") || document;
    Promise.race([
        sleep(5000).then(() => Promise.reject("Timed out")),
        waitForScriptLoaded("commonmark", node)
    ]).then(() => loadPage(container, path))
        .catch((reason) => {
            throw new Error("Failed to load commonmark.js: " + reason);
        });
}
