/**
 * Some browser extensions annotate server-rendered elements before React starts.
 * Remove only their known markers before hydration, including markers on Next's
 * metadata boundary. Keep React's mismatch warnings enabled for application bugs.
 * Next.js runs this module synchronously before hydrating the document.
 */
const extensionMarker = /^(?:bis_skin_checked|bis_register|__processed_[\da-f-]+__)$/i;

for (const element of document.querySelectorAll('*')) {
  for (const name of element.getAttributeNames()) {
    if (extensionMarker.test(name)) {
      element.removeAttribute(name);
    }
  }
}
