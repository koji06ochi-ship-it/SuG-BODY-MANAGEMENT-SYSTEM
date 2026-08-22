(function () {
  "use strict";

  var FEMALE_PROFILES = {
    female_slim: {
      name: "SLIM", label: "スリム", range: "22〜28%",
      focus: ["姿勢", "後脚・臀部", "背中"]
    },
    female_athletic: {
      name: "ATHLETIC", label: "アスリート", range: "20〜26%",
      focus: ["後脚・臀部", "前脚", "背中"]
    },
    female_fitness: {
      name: "FITNESS", label: "フィットネス", range: "19〜25%",
      focus: ["後脚・臀部", "肩", "背中"]
    },
    female_muscular: {
      name: "MUSCULAR", label: "マッスキュラー", range: "18〜25%",
      focus: ["後脚・臀部", "肩", "前脚"]
    },
    female_physique: {
      name: "PHYSIQUE", label: "フィジーク", range: "18〜24%",
      focus: ["後脚・臀部", "肩", "背中"]
    }
  };

  function registerFemaleProfiles() {
    var profiles = window.__SUG_IDEAL_DAILY_PROFILES__;
    if (!profiles) return false;
    Object.keys(FEMALE_PROFILES).forEach(function (key) {
      var item = FEMALE_PROFILES[key];
      profiles[key] = {
        name: item.name,
        label: item.label,
        range: item.range,
        focus: item.focus.slice(),
        gender: "female",
        mask: "okame"
      };
    });
    return true;
  }

  function exerciseStats() {
    var standard = typeof RULE_MENU === "undefined" ? {} : RULE_MENU;
    var beginner = typeof BEGINNER_RULE_MENU === "undefined" ? {} : BEGINNER_RULE_MENU;
    var standardNames = new Set();
    var beginnerNames = new Set();
    var byPart = {};

    Object.keys(standard).forEach(function (part) {
      var rows = Array.isArray(standard[part]) ? standard[part] : [];
      byPart[part] = rows.length;
      rows.forEach(function (row) {
        if (row && row[0]) standardNames.add(String(row[0]));
      });
    });
    Object.keys(beginner).forEach(function (part) {
      (beginner[part] || []).forEach(function (row) {
        if (row && row[0]) beginnerNames.add(String(row[0]));
      });
    });

    return {
      version: "26.5.24",
      uniqueExercises: standardNames.size,
      beginnerExercises: beginnerNames.size,
      byPart: byPart,
      femaleProfiles: Object.keys(FEMALE_PROFILES).length,
      maleProfiles: 5
    };
  }

  function renderExerciseStats() {
    var box = document.getElementById("trainingExerciseLibraryCount");
    var stats = exerciseStats();
    if (box) box.textContent = "全" + stats.uniqueExercises + "種｜初心者" + stats.beginnerExercises + "種";
    return stats;
  }

  registerFemaleProfiles();
  renderExerciseStats();

  window.__SUG_IDEAL_FEMALE_PROFILES__ = FEMALE_PROFILES;
  window.registerFemaleIdealProfiles = registerFemaleProfiles;
  window.getSugExerciseLibraryStats = exerciseStats;
  window.renderSugExerciseLibraryStats = renderExerciseStats;

  document.addEventListener("DOMContentLoaded", function () {
    registerFemaleProfiles();
    renderExerciseStats();
  });
})();
