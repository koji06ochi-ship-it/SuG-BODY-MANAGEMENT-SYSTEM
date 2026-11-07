(function(root){'use strict';const catalog=[
  {
    "name": "5/3/1",
    "meaning": "Wave main-lift percentages across four weeks using Training Max.",
    "purpose": "Develop planned strength progression.",
    "pros": "Provides a predictable cycle and submaximal work.",
    "cons": "An excessive TM can accumulate fatigue.",
    "suited": "Lifters with established main-lift technique.",
    "check": "TM, completed reps, RIR and weekly volume.",
    "caution": "Recheck TM and symptoms; never force the plus set to failure."
  },
  {
    "name": "5×5",
    "meaning": "Use five sets of five reps with a consistent main lift.",
    "purpose": "Build repeatable strength practice.",
    "pros": "Simple workload tracking.",
    "cons": "The same load may become excessive across all five sets.",
    "suited": "Lifters who can recover between repeated sessions.",
    "check": "Load, completed reps per set and technique.",
    "caution": "Increase only after clean completion and adequate recovery."
  },
  {
    "name": "DUP",
    "meaning": "Alternate strength, hypertrophy and technique sessions within a week.",
    "purpose": "Practice multiple qualities without identical daily loading.",
    "pros": "Separates session emphasis.",
    "cons": "Too many demanding days can still overlap fatigue.",
    "suited": "Lifters with a stable weekly schedule.",
    "check": "Daily intensity, sets and recovery between sessions.",
    "caution": "Do not treat every session as maximal."
  },
  {
    "name": "RPE/RIR",
    "meaning": "Choose a load using perceived exertion or reps in reserve.",
    "purpose": "Match effort to the current session.",
    "pros": "Allows day-to-day adjustment.",
    "cons": "Self-reported effort is imperfect, especially for novices.",
    "suited": "Lifters learning effort calibration.",
    "check": "Target RIR, actual RIR and technique.",
    "caution": "Stop or reassess if pain or technique deterioration appears."
  },
  {
    "name": "線形ピリオダイゼーション",
    "meaning": "Change volume and intensity progressively over planned phases.",
    "purpose": "Build toward a defined training objective.",
    "pros": "Clear phase progression.",
    "cons": "Fixed schedules may not match recovery changes.",
    "suited": "People with a known training timeline.",
    "check": "Phase, volume, load and readiness.",
    "caution": "Adjust the schedule rather than forcing planned loads."
  },
  {
    "name": "ブロックピリオダイゼーション",
    "meaning": "Organize accumulation, transformation and realization blocks.",
    "purpose": "Prioritize specific qualities across phases.",
    "pros": "Concentrates training emphasis.",
    "cons": "A neglected quality can regress between blocks.",
    "suited": "Experienced trainees with specific objectives.",
    "check": "Block duration, main quality and fatigue.",
    "caution": "Coordinate blocks with competition and recovery demands."
  },
  {
    "name": "トップセット＋バックオフ",
    "meaning": "Perform a heavier top set followed by lighter back-off work.",
    "purpose": "Combine heavy practice with additional manageable volume.",
    "pros": "Separates high-intensity and volume work.",
    "cons": "Back-off volume can exceed recovery capacity.",
    "suited": "Lifters with reliable technique under load.",
    "check": "Top-set effort, back-off load and completed sets.",
    "caution": "A difficult top set is a reason to reduce later work."
  },
  {
    "name": "ピラミッド法",
    "meaning": "Adjust load and reps from set to set in an ascending sequence.",
    "purpose": "Practice several effort ranges within a session.",
    "pros": "Offers gradual load exposure.",
    "cons": "Fatigue from earlier sets affects later performance.",
    "suited": "Trainees who can distinguish warm-up and working sets.",
    "check": "Per-set weight, reps, rest and RIR.",
    "caution": "Warm-up sets are not evidence of readiness for every heavier load."
  },
  {
    "name": "リバースピラミッド法",
    "meaning": "Begin working sets heavier, then reduce weight for later sets.",
    "purpose": "Prioritize a fresh heavy set while retaining volume.",
    "pros": "Heavy practice occurs before accumulated working fatigue.",
    "cons": "Requires sufficient preparation before the first work set.",
    "suited": "Experienced lifters with consistent warm-ups.",
    "check": "First-set quality and reductions across sets.",
    "caution": "Do not skip warm-up or force the first set."
  },
  {
    "name": "クラスターセット",
    "meaning": "Split a set into small clusters separated by short rests.",
    "purpose": "Maintain movement quality during repeated efforts.",
    "pros": "Brief rests may reduce within-set fatigue.",
    "cons": "More timing complexity; work remains demanding.",
    "suited": "Trainees who can control rest timing.",
    "check": "Cluster size, intra-set rest and speed if measured.",
    "caution": "End a cluster when movement quality deteriorates."
  },
  {
    "name": "ドロップセット",
    "meaning": "Reduce load after a main effort and continue repetitions.",
    "purpose": "Add local muscular work with a lighter load.",
    "pros": "Time-efficient additional volume.",
    "cons": "Local fatigue may obscure deteriorating technique.",
    "suited": "Experienced trainees using an appropriate exercise.",
    "check": "Each drop, reps and technique.",
    "caution": "Avoid unsupported failure and repeated painful repetitions."
  },
  {
    "name": "レストポーズ法",
    "meaning": "Add short rests between small groups of extra repetitions.",
    "purpose": "Extend an effort with brief recovery intervals.",
    "pros": "Compact high-effort work.",
    "cons": "High fatigue; not interchangeable with ordinary sets.",
    "suited": "Experienced trainees using controllable exercises.",
    "check": "Initial reps, rest duration and additional reps.",
    "caution": "Do not use repeated failure when technique or symptoms worsen."
  },
  {
    "name": "スーパーセット",
    "meaning": "Pair two exercises with planned rest around the pair.",
    "purpose": "Organize time and complementary work.",
    "pros": "Can reduce session duration.",
    "cons": "Exercise interference can reduce performance.",
    "suited": "Trainees who can maintain technique in both exercises.",
    "check": "Exercise pairing, rest and actual reps.",
    "caution": "Use enough rest for demanding or technically complex lifts."
  },
  {
    "name": "エキセントリック強調",
    "meaning": "Emphasize control during the lowering phase.",
    "purpose": "Practice eccentric control and load tolerance.",
    "pros": "Makes lowering tempo explicit.",
    "cons": "Novel eccentric loading can cause substantial soreness.",
    "suited": "Trainees progressing gradually in a familiar movement.",
    "check": "Lowering duration, load and soreness over days.",
    "caution": "Increase unfamiliar eccentric work conservatively."
  },
  {
    "name": "アイソメトリック",
    "meaning": "Hold force at a defined joint angle for a planned duration.",
    "purpose": "Practice angle-specific force or positional control.",
    "pros": "Makes hold position and time measurable.",
    "cons": "Adaptation can be angle-specific; breath holding adds strain.",
    "suited": "Trainees with a clearly defined position and setup.",
    "check": "Joint position, duration and effort.",
    "caution": "Breathe normally and stop if symptoms appear."
  },
  {
    "name": "プライオメトリクス",
    "meaning": "Practice jumps and landings with controlled contact volume.",
    "purpose": "Develop rapid force production and landing skill.",
    "pros": "Links take-off and landing quality.",
    "cons": "Contacts add impact load and require space.",
    "suited": "Trainees with suitable landing control.",
    "check": "Contacts, landing quality and rest.",
    "caution": "Progress impact gradually; pain or poor landings call for stopping."
  },
  {
    "name": "VBT（速度ベース）",
    "meaning": "Use genuinely measured lifting velocity under a defined protocol.",
    "purpose": "Review load and fatigue using velocity data.",
    "pros": "Offers movement-speed feedback.",
    "cons": "Requires suitable validated measurement; estimates are not readings.",
    "suited": "Lifters with a compatible velocity device.",
    "check": "Measured velocity, load and protocol.",
    "caution": "Do not fabricate velocity when no sensor is connected."
  },
  {
    "name": "コントラスト法",
    "meaning": "Pair a heavier movement with a related explosive action.",
    "purpose": "Practice force and speed in a planned pairing.",
    "pros": "Combines distinct movement demands.",
    "cons": "Fatigue may outweigh any short-term performance benefit.",
    "suited": "Experienced trainees with good explosive technique.",
    "check": "Pairing, rest and measured jump or speed output.",
    "caution": "Allow adequate recovery and stop when explosive quality drops."
  },
  {
    "name": "ダブルプログレッション",
    "meaning": "Increase reps within a range before increasing load.",
    "purpose": "Progress one variable at a time.",
    "pros": "Simple, observable progression criteria.",
    "cons": "Rep improvement alone does not guarantee recovery.",
    "suited": "Trainees with a defined rep range.",
    "check": "Completed reps, load and target RIR.",
    "caution": "Increase load only after meeting the range with sound technique."
  },
  {
    "name": "テンポコントロール",
    "meaning": "Specify lowering, pause, lifting and pause durations.",
    "purpose": "Practice control through defined movement phases.",
    "pros": "Makes execution repeatable.",
    "cons": "Slower tempo changes load tolerance.",
    "suited": "Trainees learning movement control.",
    "check": "Four-part tempo, load and actual reps.",
    "caution": "Do not equate slower movement with universally better results."
  },
  {
    "name": "片側・片脚トレーニング",
    "meaning": "Train one side or leg at a time with suitable support.",
    "purpose": "Observe each side's task-specific capacity.",
    "pros": "Allows side-specific practice.",
    "cons": "Balance may limit load before strength does.",
    "suited": "Trainees who can use support safely.",
    "check": "Side, load, stability and task performance.",
    "caution": "Side differences are not automatically abnormal; manage fall risk."
  },
  {
    "name": "バリスティック・パワー",
    "meaning": "Move an appropriate load explosively under a safe setup.",
    "purpose": "Practice rapid force expression.",
    "pros": "Focuses intent and execution speed.",
    "cons": "Needs space, equipment and a suitable release or stopping strategy.",
    "suited": "Trainees with competent technique.",
    "check": "Load, repetitions and speed only when measured.",
    "caution": "Never sacrifice safe deceleration or equipment control."
  },
  {
    "name": "スプリント加速",
    "meaning": "Practice short accelerations with full enough rest.",
    "purpose": "Develop initial sprint acceleration skill.",
    "pros": "Makes starting mechanics explicit.",
    "cons": "High force and surface conditions affect risk.",
    "suited": "Trainees prepared for sprint loading.",
    "check": "Distance, rest, surface and measured time.",
    "caution": "Progress sprint exposure and stop with pain or loss of control."
  },
  {
    "name": "減速・方向転換",
    "meaning": "Practice stopping and changing direction with planned approach speed.",
    "purpose": "Develop controlled braking and redirection.",
    "pros": "Connects approach speed with movement control.",
    "cons": "Fast entries increase braking demand.",
    "suited": "Athletes prepared for directional work.",
    "check": "Approach speed, surface, steps and control.",
    "caution": "Begin at a manageable speed and avoid uncontrolled cutting."
  },
  {
    "name": "反復スプリント",
    "meaning": "Repeat short sprints with defined work and rest intervals.",
    "purpose": "Practice repeated high-intensity efforts.",
    "pros": "Makes recovery demands observable.",
    "cons": "Fatigue reduces sprint quality and increases load.",
    "suited": "Prepared athletes with a clear conditioning purpose.",
    "check": "Sprint times, rest and quality decay.",
    "caution": "Stop when performance or technique drops beyond the planned limit."
  },
  {
    "name": "ゾーン2持久運動",
    "meaning": "Perform sustained aerobic work at an individually appropriate easy intensity.",
    "purpose": "Develop sustainable aerobic conditioning.",
    "pros": "Usually permits longer controlled practice.",
    "cons": "Zone definitions vary; a label is not a measurement.",
    "suited": "Trainees with an appropriate activity and intensity reference.",
    "check": "Duration, talk test or measured heart rate.",
    "caution": "Do not invent heart-rate zones without a suitable basis."
  },
  {
    "name": "閾値・テンポ練習",
    "meaning": "Perform sustained or interval work near an individually assessed threshold.",
    "purpose": "Practice tolerating a higher sustainable intensity.",
    "pros": "Specific pacing practice.",
    "cons": "Threshold estimates and fatigue vary between days.",
    "suited": "Endurance trainees with a known pacing reference.",
    "check": "Duration, pace, perceived effort and recovery.",
    "caution": "Reduce intensity when the planned pace is not sustainable safely."
  },
  {
    "name": "HIIT（高強度インターバル）",
    "meaning": "Alternate higher-intensity work and recovery periods.",
    "purpose": "Develop tolerance for repeated hard efforts.",
    "pros": "Flexible work/rest structure.",
    "cons": "High fatigue; hard is not necessarily maximal.",
    "suited": "Prepared trainees using a suitable modality.",
    "check": "Work duration, rest, completed bouts and effort.",
    "caution": "Stop for concerning symptoms; increase exposure gradually."
  },
  {
    "name": "テーパー（試合前調整）",
    "meaning": "Reduce training volume before an event while retaining selected intensity.",
    "purpose": "Manage fatigue approaching performance.",
    "pros": "Preserves familiar practice while allowing recovery.",
    "cons": "An excessive reduction or late overload can undermine preparation.",
    "suited": "Athletes with a known event date.",
    "check": "Event date, volume reduction and readiness.",
    "caution": "Avoid novel hard work immediately before the event."
  },
  {
    "name": "デロード（負荷軽減週）",
    "meaning": "Temporarily reduce training stress through load, volume or both.",
    "purpose": "Create recovery space before renewed progression.",
    "pros": "A planned opportunity to reassess fatigue.",
    "cons": "A deload is not treatment for persistent pain.",
    "suited": "Trainees with a reason to reduce training stress.",
    "check": "Reduced volume, symptoms and readiness trend.",
    "caution": "Persistent or concerning symptoms require appropriate assessment."
  }
];if(typeof module==='object'&&module.exports)module.exports=catalog;else{root.EVOLINK_METHOD_DETAILS=catalog;const existing=root.__SUG_METHOD_GUIDES__;if(existing)existing.evolink=existing.evolink.map(row=>({...row,...catalog.find(x=>x.name===row.name)}));}})(typeof window==='undefined'?globalThis:window);