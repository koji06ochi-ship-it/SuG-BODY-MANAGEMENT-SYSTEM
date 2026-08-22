(function(){'use strict';
// Disabled legacy V26.5.77 app-folder injector. It contained embedded character artwork
// and obsolete folder contents that conflict with the canonical six-category UI.
['sugAppFolderOverlay','sugFolderOverlay','sugInspectionPanel'].forEach(id=>document.getElementById(id)?.remove());
window.__SUG_LEGACY_APP_FOLDERS_DISABLED__='26.5.85';
})();