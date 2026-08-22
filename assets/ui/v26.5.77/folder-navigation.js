(function(){'use strict';
// Legacy V26.5.77 navigation disabled by V26.5.85 canonical six-category UI.
// This file previously embedded TRAINER_IMG / CLIENT_IMG and recreated the obsolete
// TRAINER SCREENING card. Keep as a no-op so old cached references cannot recreate it.
['sugInspectionPanel','sugFolderOverlay','sugAppFolderOverlay'].forEach(id=>document.getElementById(id)?.remove());
document.querySelectorAll('.sugRealHY,.sugHYRoles,.sugHYRoleGuide,.trainer-screening,.sugTrainerScreening').forEach(e=>e.remove());
window.__SUG_LEGACY_FOLDER_NAV_DISABLED__='26.5.85';
})();