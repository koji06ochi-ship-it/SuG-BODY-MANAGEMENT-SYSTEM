/* English presentation adapter. Stored field values and user text stay unchanged. */
(()=>{'use strict';
const dictionary=Object.fromEntries(String.raw`
続きから始める|Continue your training
保存済み記録|Saved records
閉じて戻る|Close and return
一覧へ戻る|Back to overview
一覧|Overview
入力・履歴|Workout entry / history
プラン・30方式|Plan / 30 methods
プラン・5/3/1|Plan / 5/3/1
記録を入力|Enter workout
重量・回数・セット・RIR|Weight / reps / sets / RIR
記録ボタンへ|Show save button
入力後、内容を確認して保存|Review entered values, then save
過去の実AI接続記録|Past live AI connection record
写真の貼付・ドラッグ操作|Paste or drag a comparison photo

振り返り・分析・次の行動|Reflect / Analyse / Choose your next step
記録の振り返り|Review your records
本人が選ぶ|Your choice
今の記録と評価|Records and evaluation
記録の充足|Record coverage
総合評価|Overall evaluation
評価点は算出しません|No overall score is calculated
前回との比較|Compare with previous records
条件を確認|Check conditions
別日・同条件の記録を詳細で確認|Review dates and matching conditions in detail
記録を比較|Compare records
前7日・直近7日|Previous / latest 7 days
保存済みの記録のみ。体調・疲労は自己申告です。|Saved records only. Health and fatigue are self-reported.
保存済み記録のみ。体調・疲労は自己申告です。|Saved records only. Health and fatigue are self-reported.
課題と確認ポイント|Review points
記録を確認|Check records
未記録の分野・比較条件を確認してください。|Check missing areas and comparison conditions.
保存済み記録から確認|Review saved records
本人が判断|Your decision
継続・変更は週次レビューで検討します。|Consider continuing or changing in your weekly review.
理由と次週の選択|Reasons and next week's choice
次のアクションプラン|Next action plan
週次を見直す|Review next week
目標・理由・本人選択|Goals, reasons and your choice
プランを調整|Adjust your plan
次回候補・本人承認|Candidate and your approval
回復を記録|Log recovery
睡眠・疲労・履歴|Sleep, fatigue and history
履歴・レポート|History and reports
推移グラフ|Trend chart
実測体重・4 / 8 / 12週|Measured weight / 4, 8, 12 weeks
既存の食事変更・承認済み予定|Food target changes and approved plan
振り返りメモ|Reflection notes
本人選択・保存原文|Your choice and original text
データ出力|Export data
既存JSONバックアップ|Existing JSON backup
PDF / CSV出力は未対応。負荷の過去適用一覧は未保存です。|PDF / CSV export is unavailable. Past load applications are not stored.
現状分析・記録の統合|Current analysis and linked records
保存記録を読込済み。未記録をゼロ・良好とは扱いません。|Saved records loaded. Missing records do not mean zero intake or good condition.

設定・データ管理|Settings & data
継続が、理想の身体をつくる。|Consistency builds your future.
記録から、次の行動を考える。|Your records. Your next step.
トレーニング設計|Training plan
食事プラン|Meal plan
身体の変化|Body changes
相談・記録|Reflect & record
分析・次の一歩|Review & progress
今日の状況|Today's overview
選択日の状況|Selected day's overview
今週のサマリー →|Weekly summary →
歩数|Steps
未連携|Not connected
ヘルスケアの歩数連携は未実装|Health step sync is not implemented
摂取カロリー|Energy intake
未記録|Not recorded
食事記録がありません|No food entries
総消費カロリー|Energy expenditure
消費エネルギーの取得は未実装|Energy expenditure sync is not implemented
消費 − 摂取|Expenditure − intake
算出不可|Unavailable
消費エネルギー取得後に計算|Requires expenditure data
食事記録から自動集計|Total from food entries
今日の運動を記録 →|Log today's training →
継続が、|Consistency
進化をつくる。|builds progress.
正しいフォームで、理想の身体へ。|Build progress with sound technique.
選ぶ・記録する・振り返るを、ひとつに。|Choose. Record. Reflect.
今日のトレーニングを記録 →|Log today's training →
記録を振り返る|Review records
今日のトレーニング|Today's training
入力済みのみ|Recorded entries only
記録セット数|Recorded sets
総挙上量（入力分）|Recorded volume
現在の目標|Current goal
未設定|Not set
自分に合う方法を、選ぶ。|Choose your approach.
30方式の説明と実施記録を確認できます。自動計算に対応する範囲は方式ごとに異なります。|Explore 30 training methods. Calculation support varies by method.
方法を選ぶ|Choose a method
実施記録|Training log
分析|Analysis
30方式の負荷計算 ↓|30-method load calculator ↓
30方式の評価・負荷計算|Method review & load calculation
選択方式：|Selected method: 
筋力・周期設計|Strength & periodization
セット・筋肥大|Sets & hypertrophy
瞬発・競技|Power & sport
持久・コンディショニング|Endurance & conditioning
1RM・Training Max。方式と計測条件が合わない式は使いません。|1RM and Training Max. Use equations only when their conditions match.
対象種目（入力済み履歴）|Exercise from recorded history
選択してください|Select an option
目的（提案の計算条件）|Goal for calculation
減量・引き締め|Fat loss
筋肥大・増量|Hypertrophy
増量・筋肥大|Hypertrophy
体重・体型維持|Maintenance
競技力向上|Sport performance
競技力|Sport
維持|Maintain
経験|Experience
初心者|Beginner
中級者|Intermediate
上級者|Advanced
性別（任意：一律補正には使用しない）|Sex (optional; no blanket correction)
指定しない|Not specified
男性|Male
女性|Female
その他・回答しない|Other / prefer not to say
回復状態（本人による確認）|Recovery (self-reported)
未確認|Not confirmed
通常|Normal
良好|Good
回復低下|Poor recovery
重量刻み kg|Weight increment (kg)
増量幅 %|Increase (%)
確認済み1RM kg|Confirmed 1RM (kg)
TM比率 %|TM ratio (%)
回復記録の照合：回復データなし|Recovery check: no records
対象日以前の回復記録なし。元データ：EVOLINK内の本人入力。BODY・HealthKit自動連携は未実装。|No recovery entry on or before this date. Source: self-reported EVOLINK data. BODY and HealthKit sync are not implemented.
重量と反復回数を本人が確認した|I checked the weight and reps
フォーム・可動域の実施条件を確認した|I checked technique and range of motion
今回の回復状態を本人が確認した|I checked my current recovery
計算・比較する|Calculate & compare
確認チェックを解除|Clear confirmations
確認した実績からのみ計算します。「計算・比較する」で結果を表示します。数値は自動保存しません。|Calculate from confirmed records only. Results appear after your action and are not saved automatically.
確認記録のみ参照。計算ボタンは読み取り専用で、保存済み記録・週間プラン・ADAPTの候補を自動上書きしません。BODY・センサーのリアルタイム連携は未実装。|Read-only calculation from confirmed records. Logs, weekly plans and ADAPT candidates stay unchanged. No live BODY or sensor sync.
トレーニング方式・技法|Training methods & techniques
30種類から選択可能。5/3/1・5×5には重量計算、DUP・RPE/RIRには基本プレビューを搭載。各方式の週間配置例を作れます。5/3/1・5×5のみ主種目の重量を計算。その他の技法は例示であり、測定・自動処方ではありません。|Choose from 30 methods. 5/3/1 and 5×5 include load examples; DUP and RPE/RIR include basic previews. Other methods show scheduling examples, not measured or automatic prescriptions.
トレーニング法 30方式|30 training methods
eVo既存18＋BODY PRISMの追加12／重複除外|18 original methods + 12 BODY PRISM additions; duplicates excluded
すべて|All
表示|Showing
方式。選択した方法は実施記録にも反映。重量の自動処方は方式によって異なります。|methods. The selected method is used in new log entries. Load support varies by method.
TMに基づく週次の強度変化と筋力向上|Weekly intensity changes based on Training Max
基本種目を5セット×5回で管理|Manage main lifts with 5 sets of 5 reps
週内に筋力・筋肥大・動作練習を配置|Schedule strength, hypertrophy and technique within a week
当日の余力で負荷調整を検討|Consider load using current reps in reserve
線形ピリオダイゼーション|Linear periodization
期間に応じて強度と総量を調整|Adjust intensity and volume across phases
ブロックピリオダイゼーション|Block periodization
蓄積・転換・発揮などの段階に分ける|Organize accumulation, transformation and performance phases
トップセット＋バックオフ|Top set + back-off
重い主セットと軽い追加セットを組み合わせる|Combine a heavy main set with lighter additional sets
ピラミッド法|Pyramid
セットごとに重量と回数を変える|Vary weight and reps across sets
リバースピラミッド法|Reverse pyramid
高重量セットから開始して負荷を下げる|Start heavy, then reduce the load
クラスターセット|Cluster sets
セット内休息を挟み動作の質を管理|Use intra-set rest to manage movement quality
ドロップセット|Drop sets
主セット後に重量を下げ反復を続ける|Reduce weight after the main set and continue
レストポーズ法|Rest-pause
短い休息を挟んで反復を追加する|Add reps after short rests
スーパーセット|Supersets
2種目を組み合わせて実施する|Pair two exercises
エキセントリック強調|Eccentric emphasis
筋が伸びる局面の負荷・速度を管理|Control load and speed during the lowering phase
アイソメトリック|Isometrics
一定関節角度で力を発揮する|Produce force at a fixed joint angle
プライオメトリクス|Plyometrics
跳躍・着地を含む素早い力発揮を練習|Practice rapid force production, jumping and landing
VBT（速度ベース）|VBT (velocity-based)
実測した挙上速度で負荷や疲労を管理|Use measured lifting speed to manage load and fatigue
コントラスト法|Contrast training
高負荷運動と爆発的動作を組み合わせる|Pair heavy lifting with explosive movement
ダブルプログレッション|Double progression
回数と重量を段階的に増やす|Progress reps and weight in stages
テンポコントロール|Tempo control
動作時間を調整し制御を学ぶ|Adjust movement duration to practice control
片側・片脚トレーニング|Unilateral training
左右それぞれの課題と支持能力をみる|Observe each side's control and support
バリスティック・パワー|Ballistic power
負荷を速く動かし力発揮速度を高める|Move loads rapidly to train power
スプリント加速|Sprint acceleration
初速を高める方向と接地を学ぶ|Practice acceleration direction and ground contact
減速・方向転換|Deceleration & change of direction
止まる・切り返す能力を高める|Practice stopping and changing direction
反復スプリント|Repeated sprints
短い高強度運動を繰り返す能力を育てる|Build repeated high-intensity effort capacity
ゾーン2持久運動|Zone 2 endurance
比較的持続可能な強度で有酸素能力を育てる|Develop aerobic capacity at a sustainable intensity
閾値・テンポ練習|Threshold / tempo training
継続できる比較的高い運動強度を伸ばす|Develop sustainable higher-intensity capacity
HIIT（高強度インターバル）|HIIT (high-intensity intervals)
強弱を繰り返し高強度耐性を高める|Alternate work and recovery intervals
テーパー（試合前調整）|Taper
疲労を減らし技能・強度を保って本番を迎える|Reduce fatigue while maintaining skill and intensity
デロード（負荷軽減週）|Deload
蓄積疲労を管理し再び適応する余裕を作る|Reduce accumulated fatigue before further progression
このトレーニング法を選ぶ理由|Why choose this method?
意味・やり方|What it is & how it works
トレーニングマックスを基に波状に負荷を変える枠組み。補助種目と回復量も調整。|A wave-based framework using Training Max, with assistance work and recovery adjustments.
目的|Purpose
中長期で筋力を段階的に積み上げる|Build strength progressively over time
メリット|Benefits
周期を決めて過剰な毎回MAX挑戦を避けやすい。|A planned cycle can reduce repeated maximal attempts.
デメリット・限界|Limitations
TMを過大設定すると高強度の疲労やフォーム破綻につながりやすい。|An excessive Training Max may increase fatigue and compromise technique.
向いている場面|When to consider it
主要挙上の技術があり、週単位の計画を立てたい人|For lifters with established technique who want a weekly structure
確認する指標|What to track
セット品質、推定筋力、疲労、週ごとの総負荷を記録|Record set quality, estimated strength, fatigue and weekly volume
注意：トレーニングマックスの過大設定を避け、怪我や体調で負荷を調整。|Avoid an excessive Training Max. Adjust for injury and current condition.
方法の得失は条件付き。どの方式が最適かは目的・経験・回復状況と記録で再評価します。|Benefits depend on context. Reassess the method using your goals, experience, recovery and records.
5/3/1 — Training Maxを基準に計算|5/3/1 — calculate from Training Max
トレーニングマックス（TM）は一般的な設定例として推定1RMの90%を使用します。重量は2.5kg刻みの目安。実施重量・回数はフォームや状態で調整。|Example: TM is 90% of estimated 1RM, rounded to 2.5 kg. Adjust actual work for technique and condition.
推定1RM（kg）|Estimated 1RM (kg)
週の選択|Select week
軽め|Light
重量を計算|Calculate loads
推定1RMを入力すると、各セットの計算例が表示されます。初期値や架空の重量は入れていません。|Enter estimated 1RM to see set examples. No invented starting load is provided.
トレーニングを記録|Log training
週間プラン作成|Build a weekly plan
選んだ方式で、1週間の実施例を組む。|Create a weekly example with your selected method.
5/3/1・5×5は主種目の重量も計算。それ以外はセット技法を含む週間配置例です。実際の処方は体調・練習歴・環境に合わせて確認します。|5/3/1 and 5×5 include main-lift loads. Other methods show weekly examples. Check suitability for your condition, training history and environment.
主種目の推定1RM（kg）|Main lift estimated 1RM (kg)
主種目|Main lift
スクワット|Squat
ベンチプレス|Bench press
デッドリフト|Deadlift
オーバーヘッドプレス|Overhead press
その他（本人が指定する主種目）|Other main lift (self-selected)
週の回数|Sessions per week
週2回|2 per week
週3回|3 per week
週4回|4 per week
週・フェーズ|Week / phase
この条件で週間プランを保存|Save weekly plan
ボタンを押したときだけ新規作成。既存の運動記録・重量・食事目標は変更しません。|Created only when you press Save. Existing training records, loads and food targets stay unchanged.
まだ週間プランを保存していません。まず実施例を作ってください。|No weekly plan saved. Start by creating an example.
フォーム・動作解析|Technique & movement analysis
動作の質も確かめる。|Review movement quality too.
将来はBIG3 ANALYZERと連携し、ROM・REP・速度・バー軌道を扱う。ここには、未測定の角度や筋活動率を表示しない。|Future BIG3 ANALYZER integration may support ROM, reps, velocity and bar path. No unmeasured angles or muscle activation values are shown.
未連携・未計測|Not connected / not measured
実績から次回負荷を検討|Review next load from records
データの管理|Data management
保存先はこのブラウザーのlocalStorageです。写真は保存対象外。端末変更時にはJSON書き出し・読み込みが必要です。|Records use this browser's localStorage. Photos are excluded. Use JSON export/import to move records between devices.
保存状態を診断|Check storage
JSONを書き出す|Export JSON
JSONを読み込む|Import JSON
この端末の記録を消去|Erase this browser's records
実際の書込み・読込みは「保存状態を診断」で確認できます。ブラウザー終了・再起動後の保持は別途確認が必要です。|Use Check storage to test writing and reading. Retention after browser restart requires a separate check.
食事プラン・摂取記録|Meal plan & food log
食事を記録|Log food
食べる力が、|Fuel today.
カラダをつくる。|Build tomorrow.
目的別の食事プランと摂取記録。kcal・PFCは設定値と参考食品値をもとに集計する。|Plan meals and log intake. Energy and macros use your settings and reference food values.
食事記録|Food log
栄養戦略|Nutrition strategies
栄養目標を設定|Set nutrition targets
現在の体重（kg）|Current weight (kg)
1日の目標エネルギー（kcal）|Daily energy target (kcal)
たんぱく質設定（g/kg）|Protein (g/kg)
脂質配分|Fat share
栄養目標を計算・保存|Calculate & save targets
自動の必要カロリー算出ではありません。本人・専門家が設定したkcalをPFCに配分する試作。体重・年齢・競技量などに基づく必要量の評価、体調確認は別途必要です。|This does not estimate calorie needs. It distributes a user- or professional-defined target into macros. Individual needs and condition require a separate assessment.
計算結果|Calculation results
体重と1日の目標エネルギーを入力すると、PFCの配分例が表示されます。|Enter body weight and daily energy target to see a macro example.
目的別の一日献立|Daily menu example
トレーニング日|Training day
休養日|Rest day
朝|Breakfast
昼|Lunch
間食|Snack
夜|Dinner
ご飯 150g・卵 1個・納豆 1パック|Rice 150 g · egg 1 · natto 1 pack
ご飯 150g・鶏むね肉 150g・温野菜 150g|Rice 150 g · chicken breast 150 g · vegetables 150 g
無糖ヨーグルト 150g・バナナ 1本|Plain yogurt 150 g · banana 1
ご飯 150g・鮭 100g・温野菜 150g|Rice 150 g · salmon 100 g · vegetables 150 g
別案に切替|Show alternative
献立例と目標PFCの差|Menu vs target macros
体重と目標kcalの設定後に、献立例とのPFC差を参考表示します。|Set body weight and energy target to compare menu macros.
実際に食べた物を記録 →|Log what you ate →
写真比較（保存・送信なし）|Photo comparison (no saving or upload)
ADAPTで振り返る|Review in ADAPT
見える変化が、|See changes.
次の力になる。|Find your next step.
同じ条件で写真を比較し、身体の変化を確かめる。写真はこのタブを離れると破棄され、保存・送信しない。|Compare photos under matching conditions. Photos are discarded when leaving MIRROR and are never saved or uploaded.
写真比較|Photo comparison
比較前の写真を選択|Choose a before photo
比較後の写真を選択|Choose an after photo
並列比較|Side by side
重ね合わせ比較|Overlay
写真を破棄|Discard photos
比較の前に確認|Before comparing
撮影条件|Photo conditions
同一人物の写真|Same person
撮影距離と画角が同等|Matching distance and framing
照明条件が同等|Matching lighting
姿勢と表情が同等|Matching posture and expression
撮影条件が異なれば見かけの変化を誤認します。写真だけで筋肉量・体脂肪率・体調を測定したとは表示しません。|Different photo conditions can mislead. Photos do not measure muscle mass, body fat or health.
身体測定の履歴|Body measurement history
身体を測定した日|Measurement date
体重 kg（任意）|Weight in kg (optional)
腹囲 cm（任意）|Waist in cm (optional)
測定記録を保存|Save measurement
コーチ未接続・下書きのみ|Human coach disconnected · local drafts only
TRAININGを見る|Open TRAINING
相談の準備を、|Prepare your thoughts.
ここから。|Start here.
現在はコーチ未接続。相談メモと共有用文章を作成できるが、コーチへの送信はできない。|No human coach is connected. Prepare local notes and reports; nothing is sent to a coach.
現在：未接続|Currently disconnected
。ここに書いても指導者には届きません。ファイル書き出しは利用者が明示操作した場合のみ。|. Notes do not reach a coach. Files are exported only when you choose.
コーチへのメモ|Notes for your coach
伝えたいこと・質問|What would you like to say or ask?
カテゴリ|Category
トレーニング|Training
食事|Food
回復・体調|Recovery & condition
共有範囲（書き出し時のみ）|Export scope
メモだけ|Notes only
メモ＋運動要約|Notes + training summary
下書きを保存（送信しない）|Save draft (no sending)
指導者向けレビュー文面|Coach review draft
共有前に、内容を自分で確認。|Review before sharing.
初期状態は運動記録のみ。写真・名前・住所は含めず、食事や回復はチェックした場合にのみ含めます。データは送信されません。|Training records only by default. No photos, names or addresses. Food and recovery are included only if selected. Nothing is transmitted.
対象期間|Period
対象種目|Exercise
全種目|All exercises
食事の記録状況を含める|Include food logging coverage
睡眠・回復の自己申告を含める|Include self-reported sleep and recovery
内容を生成して確認|Build & review draft
まだ文面は生成していません。含める情報を選び、生成後に内容を確認してください。|No draft created. Select the information to include, then review the result.
クリップボードへのコピーはブラウザーの対応・許可が必要です。自動送信・自動共有なし。写真・体重測定値そのものは収録しません。|Copying requires browser support and permission. No automatic sharing. Photos and raw body measurements are excluded.
保存済みメモ|Saved notes
まだメモはありません。|No saved notes.
持ち出し用の共有テキスト|Text to review and copy
個人で確認してからテキストをコピーできます。写真や身体測定データは含めません。|Review before copying. Photos and body measurements are excluded.
コーチ向け要約をコピー|Copy coach summary
次回負荷の判断材料|Evidence for your next load
同じトレーニング履歴を参照。回復情報の自動連携は未実装。次回の候補は本人確認が必要。|Uses the same training history. Recovery sync is not implemented. You must confirm any next-session candidate.
計算対象の運動記録がまだありません。|No training records available for calculation.
この画面では増量候補を新規に確定しません。TRAININGで計算後、同じデータに基づく結果を表示します。|This panel does not create a new load decision. Calculate in TRAINING to see a result from the same records.
TRAININGで負荷を比較|Compare loads in TRAINING
セット実績を入力・確認|Enter & check set records
実績から次回を検討|Review records for your next step
TRAININGの記録を見る|View TRAINING records
振り返り、|Reflect.
もっと進化する。|Keep progressing.
運動・食事・身体と入力された回復情報を振り返り、次の候補を考える。未記録は推測で埋めない。|Review training, food, body measurements and self-reported recovery. Missing records stay missing.
再評価の材料|Review evidence
運動ログ|Training entries
栄養目標|Nutrition targets
身体測定|Body measurements
見直すポイント|Points to review
実施ログを入力してください。|Enter training records.
未入力|Missing
必要な食事目標が未設定です。|Nutrition targets are not set.
測定履歴がありません。|No measurement history.
負荷や食事を自動で増減しません。提案ではなく見直し候補を表示し、反映には利用者の明示操作を必要とします。|Loads and food targets never change automatically. These are review points; applying a change requires your explicit action.
運動 × 食事 × 身体の比較|Training × food × body
記録がつながると、変化が見える。|Connect your records. See the pattern.
運動した記録日|Days with training records
食事記録がある日|Days with food records
体重（実測入力）|Weight (self-recorded)
異なる日付の測定が2件必要|Two measurements on different days required
直近7日・入力した食事量|Food logged in the last 7 days
入力日のみの概算|Estimate from logged days only
運動未記録|No training recorded
次回の確認ポイント|Next review points
記録の充足|Record coverage
体重と期間|Weight & period
回復との整合|Recovery context
これは記録の比較で、脂肪減少・筋肥大・栄養不足の診断ではありません。食事量や重量の自動変更、コーチへの送信は行いません。|This compares records, not diagnoses of fat loss, muscle gain or malnutrition. No automatic load or food changes and no sending to a coach.
体重を記録|Log body weight
セット別の実績|Set-by-set records
セット単位の記録はまだありません。TRAININGの履歴から入力できます。過去ログの重量・RIRを自動補完しません。|No set details yet. Add them from TRAINING history. Past weights and RIR are never invented.
セット別セッション比較|Set-by-set session comparison
セット別の記録を2回分入力すると、同じ種目の前回・今回を比較できます。|Record two sessions with set details to compare the same exercise.
方式別の実績と回復・食事|Methods, recovery & food
自分には、どの方法が合っていた？|Which approach suited you?
実施時に方式を選んだ運動記録だけを集計。トレーニング効果の因果判定・方式の優劣ランキングはしません。|Includes entries with a recorded method only. No causal claims or method rankings.
集計期間|Summary period
直近|Last 
全種目（方式別実施状況）|All exercises (method coverage)
方式記録あり|Method recorded
方式未指定|No method specified
比較対象方式|Methods available
期間内に「方式を指定して保存した運動記録」がありません。旧記録に方式を自動付与しません。|No entries with a recorded method in this period. Older records are not assigned a method automatically.
同期間の参考情報（方式ごとの因果関係ではありません）|Context from the same period (not evidence of causation)
食事の一部だけ記録されている可能性があるため摂取kcalの充足は判定しません。|Food records may be incomplete, so energy adequacy is not assessed.
異なる種目を合算した挙上量は筋力比較に使えません。方式の切替時には期間・種目・経験・睡眠・栄養・痛みなどの条件が変わるため、優劣や効果を断定しません。複数方式を組み合わせた場合は判定できません。|Volume across different exercises cannot compare strength. Changes in period, exercise, experience, sleep, nutrition and pain prevent method superiority claims. Combined methods cannot be isolated.
運動を記録する|Log training
食事を記録する|Log food
複数技法 × 疲労 × 回復|Combined techniques × fatigue × recovery
組み合わせたとき、何を記録した？|What did you record when combining methods?
主方式と併用技法の組合せごとに実際の記録を集計。平均RIR・セッション疲労・同日の睡眠情報を照合する。未入力は「回復良好」と扱わない。|Summarize recorded combinations, mean RIR, session fatigue and same-day sleep. Missing data never means good recovery.
併用技法付きの運動ログはまだありません。過去記録を自動で補完しません。|No entries with combined techniques. Past records are not filled automatically.
集計は観察データです。同じ技法の効果、RIRの正確さ、筋活動率や疲労の原因を証明するものではありません。複数セット・異なる種目を混ぜた挙上量から優劣を判断しません。|These are observations, not proof of effectiveness, RIR accuracy, muscle activation or fatigue causes. Mixed set/exercise volume is not used for rankings.
ADAPTで次回予定を確認|Review next session in ADAPT
指導者向けの確認メモ|Notes to review with a coach
長期推移と変更履歴|Long-term trends & changes
1週間の数字だけで決めない。|Look beyond a single week.
体重・運動・食事の入力が何週間続いているか確認。体重平均は同じ日の最新測定値を1日分として集計し、欠測週の値は作りません。|Review weeks with weight, training and food entries. Weight averages use the latest entry per day. Missing weeks are not estimated.
体重を記録した週|Weeks with weight entries
2日以上測定の週|Weeks with at least 2 measurement days
比較可能な週平均の差|Change between comparable weekly averages
2日以上測定した週が2つ必要|Requires 2 weeks with at least 2 measurement days each
選択期間に体重記録がありません。記録のない週を推定値で埋めません。|No weight entries in this period. Missing weeks stay missing.
週末|Week ending
体重平均|Mean weight
測定日|Measurement days
食事記録日|Food log days
運動記録日|Training log days
体重平均の差は体脂肪や筋肉量の変化を示しません。食事記録がない日は0 kcalとは解釈しません。比較する週の測定条件を揃えてください。|A change in mean weight does not identify fat or muscle changes. Missing food logs do not mean zero intake. Match measurement conditions.
食事目標の変更履歴|Nutrition target change history
保存した検討案と、本人が明示適用した変更を時系列で表示。過去の設定値を推測・補完せず、履歴から自動復元もしません。|Shows saved proposals and explicitly applied changes in time order. Past settings are not invented or restored automatically.
まだ変更案・適用履歴がありません。履歴はこれから保存した操作だけを表示します。|No saved proposals or applied changes yet. History begins with saved actions.
最大20件の過去レビュー＋最新レビューを表示。STAGE 10より前の未保存の設定変更は追跡できません。日時は保存された記録値です。|Shows the latest review and up to 20 past reviews. Unsaved changes before STAGE 10 are not tracked. Dates are stored record values.
減量・増量の週次レビュー|Weekly fat-loss / hypertrophy review
数字を見てから、次の一週間を決める。|Review the evidence. Plan your next week.
直近7日とその前7日の体重平均・食事の記録日数・運動実績を並べる。体重は同日複数回測定しても1日分だけ集計。変化の原因や体脂肪量を推定しません。|Compare mean weight, food-log days and training over two 7-day periods. Weight counts once per day. No inferred causes or body-fat estimates.
前7日・体重平均|Previous 7-day mean weight
直近7日・体重平均|Latest 7-day mean weight
週平均どうしの差|Change in weekly mean
変更判断は保留・記録を確認|Hold changes; review record coverage
両週それぞれ異なる日付の体重測定が2日以上必要／両週とも食事記録が5日以上必要／NUTRITIONで目標kcalの設定が必要／目標を減量・増量・維持から選択|Needs 2 measurement days per week, 5 food-log days per week, a NUTRITION energy target and a fat-loss, hypertrophy or maintenance goal.
次週の検討内容|Proposal for next week
現状を維持|Maintain current targets
目標kcalを増やす|Increase target kcal
目標kcalを減らす|Reduce target kcal
トレーニング計画を見直す|Review training plan
変更幅（食事の場合のみ）|Change amount (food only)
本人・指導者が確認した根拠と理由|Evidence and reasons checked by you or your coach
運動・食事の記録漏れと測定条件を自分で確認した|I checked missing entries and measurement conditions
次週の検討案を保存|Save next-week proposal
カーボローディング・コンテストのピークウィーク中は通常の週次カロリー変更と区別します。未成年や個別の健康問題がある場合には、この試作の数値変更機能を自己処方として使わないでください。|Separate carb-loading or contest peak-week plans from routine energy changes. This prototype is not a self-prescription tool for minors or individual health conditions.
睡眠・疲労・回復の記録|Sleep, fatigue & recovery log
今日のコンディションを記録|Record today's condition
睡眠時間と主観的な感覚を記録する。医学的な回復スコアやHRVの実測値は生成しません。実施日の前後を混同しない日付照合を行います。|Record sleep and subjective condition. No medical readiness score or measured HRV is generated. Records are checked by date.
対象日|Date
睡眠時間（時間）|Sleep (hours)
睡眠の質（1=悪い、5=良い）|Sleep quality (1=poor, 5=good)
疲労感（1=軽い、5=強い）|Fatigue (1=low, 5=high)
筋肉痛（1=軽い、5=強い）|Soreness (1=low, 5=high)
ストレス（1=低い、5=高い）|Stress (1=low, 5=high)
回復記録を端末内に保存|Save recovery locally
同じ日付の記録は保存確認後に更新します。日々の記録だけで運動の安全性・効果を断定しません。|Updating the same date requires confirmation. Daily records do not prove safety or effectiveness.
回復の履歴|Recovery history
まだ回復記録はありません。|No recovery entries.
この履歴は端末内保存のみ。本人の明示的なJSON書き出しを除き、コーチへの送信や外部共有は行いません。|Stored locally only. No sending or sharing, except an explicit JSON export.
次回の負荷調整|Next-session load review
記録から次回重量を検討する|Review the next load from records
同一種目の別日2記録を照合。数値は例示ルールによる候補で、専門家の処方や測定済みの回復度ではありません。自動変更は行いません。|Compares two separate dates for the same exercise. Candidates use example rules, not prescriptions or measured recovery. No automatic changes.
比較する種目|Exercise to compare
実績がありません|No records
増量候補幅（kg）|Candidate increment (kg)
今回重量|Current load
結果|Result
判断保留|Hold judgment
次回候補|Next candidate
まずTRAININGで実施記録を入力してください。|Start by adding training records in TRAINING.
この候補を次回予定に反映|Approve candidate for next session
承認時だけ「次回予定」に登録。5/3/1のTMや週間プラン、過去の実施ログは変更しません。実行済みとみなす処理もありません。|Saved as a next-session plan only after approval. Training Max, weekly plans and past logs stay unchanged. This does not mark a workout completed.
次回の計画に残すメモ|Notes for your next plan
本人・指導者が決めた変更理由|Reason chosen by you or your coach
この内容を明示的に保存|Save this note explicitly
ホーム|HOME
運動|Training
ミラー|MIRROR
コーチ|COACH
アダプト|ADAPT
削除|Delete
前日へ|Previous day
翌日へ|Next day
目標 kcal|Target kcal
たんぱく質 P|Protein P
脂質 F|Fat F
炭水化物 C|Carbohydrate C
エネルギー｜目標との差|Energy vs target
目標との差|vs target
献立例|Menu example
目標|Target
エネルギー|Energy
差は食品カタログの概算値と入力された目標との算術比較で、食事処方ではありません。献立の分量を自動変更していません。|Differences are arithmetic comparisons of approximate food values and your target, not a meal prescription. Menu portions are unchanged.
食事を記録日|Food log date
食べた物（標準量の概算）|Food eaten (approximate standard portion)
何食分？|Number of portions
食事記録に追加|Add food entry
記録は入力した時点の簡易記録です。個別の食材量・銘柄・調理法で大きく変化します。|A simple entry using reference portions. Actual values vary with ingredients, brands and cooking.
今日の食事記録|Today's food entries
推定 kcal|Estimated kcal
推定 P|Estimated P
推定 F|Estimated F
推定 C|Estimated C
まだ食事の記録がありません。|No food entries yet.
ご飯|Rice
鶏むね肉|Chicken breast
鮭|Salmon
卵|Egg
納豆|Natto
無糖ヨーグルト|Plain yogurt
バナナ|Banana
温野菜|Vegetables
木綿豆腐|Firm tofu
おにぎり|Rice ball
パック| packs
体重|Weight
腹囲|Waist
記録あり|Recorded
本人の食事記録から算出|Calculated from your food entries
の食事記録から集計| food entries totalled
総挙上重量：|Total recorded volume: 
（セット詳細があれば実績値を優先）|(uses set details when available)
回復記録の照合：直近の自己申告記録あり（良好判定ではない）|Recovery check: recent self-report exists (not a medical readiness assessment)
記録上の確認項目に該当なし。回復良好の医学的判定ではない。|No recorded review flags. This is not a medical recovery assessment.
元データ：EVOLINK内の本人入力。BODY・HealthKit自動連携は未実装。|Source: self-reported EVOLINK data. No automatic BODY or HealthKit sync.
設定済|Set
フォーム|Technique
安定申告|reported stable
次回の調整には疲労と動作品質の確認が必要。|Review fatigue and movement quality before adjusting.
確認|Review
設定エネルギー|Energy target
実際の食事記録|Actual food entries
目標と実績の差は未記録に注意。|Missing entries affect comparisons with the target.
自己申告した測定値|Self-reported measurements
条件の一致と期間を確認。|Check matching conditions and time period.
負荷差は能力向上や方式の効果を証明しません。RIR・フォーム・疲労の違いを確認してください。|Load differences do not prove performance gains or method effectiveness. Review RIR, technique and fatigue.
違和感申告|discomfort reports: 
フォーム要確認または疲労強め|technique or fatigue flags: 
条件一致|Matched conditions
記録挙上量|Recorded volume
合計|Total 
実施|Completed 
差|change
回復|Recovery
睡眠の質|Sleep quality
睡眠|Sleep
疲労|Fatigue
筋肉痛|Soreness
ストレス|Stress
時間| hours
自己申告を記録済み|Self-report recorded
増量候補|Increase candidate
軽減候補|Reduction candidate
維持候補|Maintain candidate
同条件の記録で余力があり、痛み・フォーム不安定の申告がないため、小幅な増量を検討できます。|Matched records show reserve with no reported pain or unstable technique. A small increase can be reviewed.
前回|Previous
今回|Current
軽い|Low
安定|Stable
方式|Method
併用|Combined
一括入力のみ|Summary entry only
痛みなし申告|No pain reported
トレーニング記録はありません。入力した実データだけを保存します。|No workouts yet. Only actual entered records are saved.
セット詳細を入力|Add set details
セット詳細を編集|Edit set details
痛み|Pain
申告|reported
未記録・なし|Not recorded / none
セット| sets
実績|records
実測入力の週平均|Weekly mean from recorded measurements
5つの主要機能|Five main features
PC用6画面メニュー|Six-screen desktop menu
スマホ6画面ナビ|Six-screen mobile navigation
身体づくりの目的|Body goal
1日の目標エネルギー（kcal）|Daily energy target (kcal)
減量|Fat loss
増量|Hypertrophy
種目|Exercise
実施日|Workout date
今回実際に使った方式・技法|Method actually used
方式未指定・組合せ不明|No method / combination specified
主方式だけでなく、併用した技法を最大3つまで記録。何も選んでいない場合は推測しません。|Record the main method and up to 3 combined techniques. Missing selections are not inferred.
実際に併用した技法|Combined techniques actually used
同じ方式を主方式と併用欄の両方に記録しない。トレーニング方式（週単位）とセット技法（種目単位）は別の概念です。|Do not repeat the main method as a combined technique. Weekly methods and exercise-level set techniques are different concepts.
重量 kg|Weight (kg)
痛み・違和感|Pain / discomfort
あり（負荷を再検討）|Yes (review the load)
なし|None
フォームの自己評価|Self-reported technique
安定していた|Stable
不安定・未確認|Unstable / unconfirmed
セッション終了時の疲労（自己申告）|Post-session fatigue (self-reported)
未評価（ADAPTでは判断保留）|Not assessed (ADAPT holds judgment)
軽い・余力あり|Low / reserve remaining
普通・回復を確認|Moderate / check recovery
強い・回復優先|High / prioritize recovery
実際の内容を記録|Save actual workout
履歴|History
運動記録はありません。入力した実データだけを保存します。|No workouts yet. Only your entered records are saved.
レッグプレス|Leg press
ラットプルダウン|Lat pulldown
ショルダープレス|Shoulder press
その他|Other
データ管理を開く|Open data management
画面の案内|screen guide
入力済み|Recorded
操作|actions
の画面切替|screen navigation
種類| methods
測定|Measurements
／日| / day
痛みの有無が未回答|Pain is unanswered
痛みの有無を確認する|Confirm whether pain is present
痛みの申告あり|Pain was reported
負荷を増やさず状態を確認する|Hold increases and check your condition
必要に応じて専門家に相談する|Seek professional assessment when appropriate
回復状態が低い|Recovery is poor
休息を選ぶ|Choose rest
負荷を軽くして様子を見る|Consider reducing load and reviewing your condition
RIR記録または目標RIRが不足|Recorded or target RIR is missing
セットごとのRIRと目標RIRを記録する|Record set RIR and target RIR
実測RIRが目標より2以上高い|Recorded RIR is at least 2 above target
次回の負荷増加を検討する|Consider an increase for the next session
現在の負荷を維持する|Keep the current load
実測RIRが目標より2以上低い|Recorded RIR is at least 2 below target
次回の負荷軽減を検討する|Consider reducing the next load
休息とフォームを確認する|Review rest and technique
実測RIRが目標付近|Recorded RIR is near target
次回もRIRを記録する|Record RIR next time
回復状態は未記録のため負荷増加を保留|Recovery is unrecorded; hold load increases
回復状態を確認する|Confirm recovery
`.trim().split('\n').map(line=>line.split('|')));
Object.assign(dictionary,{"トレーニングマックスを基に波状に負荷を変える枠組み。補助種目と回復量も調整。":"Wave main-lift percentages across four weeks using Training Max.","中長期で筋力を段階的に積み上げる":"Develop planned strength progression.","周期を決めて過剰な毎回MAX挑戦を避けやすい。":"Provides a predictable cycle and submaximal work.","TMを過大設定すると高強度の疲労やフォーム破綻につながりやすい。":"An excessive TM can accumulate fatigue.","主要挙上の技術があり、週単位の計画を立てたい人":"Lifters with established main-lift technique.","セット品質、推定筋力、疲労、週ごとの総負荷を記録":"TM, completed reps, RIR and weekly volume.","トレーニングマックスの過大設定を避け、怪我や体調で負荷を調整。":"Recheck TM and symptoms; never force the plus set to failure.","主要な複合種目を5回×5セットとして管理する方法。最初から最大重量を狙わず、軽い重量から反復の質を確認する。":"Use five sets of five reps with a consistent main lift.","基礎筋力と挙上技能を反復で高める":"Build repeatable strength practice.","同じ主要種目で練習量と達成状況を追いやすい。":"Simple workload tracking.","5×5は全種目・全目的に適した万能プログラムではなく、疲労管理が必要。":"The same load may become excessive across all five sets.","一定のフォームと回復を維持できる人":"Lifters who can recover between repeated sessions.","同一種目・同一条件で達成セット、動作品質、RPE、翌日の回復を比較":"Load, completed reps per set and technique.","関節症状や技術が安定しない場合は回数・セットを減らす。":"Increase only after clean completion and adequate recovery.","同じ種目群でも重い日・中程度の日・速い日など目的を分ける。":"Alternate strength, hypertrophy and technique sessions within a week.","週内に筋力・筋肥大・速度などの刺激を変える":"Practice multiple qualities without identical daily loading.","同じ週の中で異なる負荷・反復刺激を計画できる。":"Separates session emphasis.","週内の強度配置が複雑で、競技や仕事の疲労と重なりやすい。":"Too many demanding days can still overlap fatigue.","複数回のトレーニングと回復を確保できる人":"Lifters with a stable weekly schedule.","同一課題の速度、反復達成、疲労推移を週ごとに比較":"Daily intensity, sets and recovery between sessions.","高強度日を連続させず、競技練習との重複負荷を管理。":"Do not treat every session as maximal.","RIR（余力回数）またはRPEを主観記録し、同じ目標でも負荷を微調整。":"Choose a load using perceived exertion or reps in reserve.","その日の余力に応じ負荷を調節":"Match effort to the current session.","日ごとのコンディション差を負荷調整に反映しやすい。":"Allows day-to-day adjustment.","RPE/RIRの自己評価は習熟が必要で、主観と実際の反復余力はずれる。":"Self-reported effort is imperfect, especially for novices.","疲労・睡眠・練習量が変動する人":"Lifters learning effort calibration.","同負荷でのRPE、速度、REP、回復を追う":"Target RIR, actual RIR and technique.","初心者のRIR自己推定は誤差が出やすい。痛みを我慢する指標にしない。":"Stop or reassess if pain or technique deterioration appears.","基礎量から高強度へ段階化し、最終段階では疲労を抜く。":"Change volume and intensity progressively over planned phases.","期間に応じて回数・負荷の重点を変更":"Build toward a defined training objective.","大会や目標日に向けて負荷と反復数を整理しやすい。":"Clear phase progression.","回復が想定とずれると予定通りの強度増加が負担になる。":"Fixed schedules may not match recovery changes.","明確な試合時期や中期目標がある人":"People with a known training timeline.","各期の筋力・動作品質・競技成果と疲労を比較":"Phase, volume, load and readiness.","期間の個人差が大きいため、予定どおり進めることを優先しない。":"Adjust the schedule rather than forcing planned loads.","筋力蓄積期→競技動作への転換期→調整期を分ける設計例。":"Organize accumulation, transformation and realization blocks.","蓄積・転換・実現の目的を分ける":"Prioritize specific qualities across phases.","特定能力に重点を置いた期間を組み立てやすい。":"Concentrates training emphasis.","ブロック間で刺激が偏ると維持したい能力が落ちる可能性がある。":"A neglected quality can regress between blocks.","競技日程に合わせて負荷を設計したい人":"Experienced trainees with specific objectives.","各期の主指標が競技成果へ移ったかを追跡":"Block duration, main quality and fatigue.","1ブロックに高負荷要素を詰め込み過ぎない。":"Coordinate blocks with competition and recovery demands.","重い主セットの後、重量を落として追加セットを行う。":"Perform a heavier top set followed by lighter back-off work.","高強度の体験と追加練習量を両立する。":"Combine heavy practice with additional manageable volume.","主セットの重量やRPE、後続セットの達成状況を比較しやすい。":"Separates high-intensity and volume work.","トップセットで疲労しすぎるとバックオフの質が落ちる。":"Back-off volume can exceed recovery capacity.","主種目の高強度刺激と運動量を両立したい経験者":"Lifters with reliable technique under load.","主セットのRIR・後続セットの反復品質と回復":"Top-set effort, back-off load and completed sets.","安全性・回復・種目条件に合わせて調整する。":"Allow adequate recovery and stop when explosive quality drops.","セットごとに重量を増やし、反復回数を減らす構成。":"Adjust load and reps from set to set in an ascending sequence.","ウォームアップから高強度へ移行する練習を整理する。":"Practice several effort ranges within a session.","負荷を段階的に上げながら動作の準備ができる。":"Offers gradual load exposure.","前半の量が多いと高重量セット前に疲労する。":"Fatigue from earlier sets affects later performance.","段階的に重い重量へ移行したい人":"Trainees who can distinguish warm-up and working sets.","各段階の重量・回数・RIR":"Per-set weight, reps, rest and RIR.","十分な準備後、重いセットから開始し後続セットで重量を下げる。":"Begin working sets heavier, then reduce weight for later sets.","高強度セットを早い段階に配置する。":"Prioritize a fresh heavy set while retaining volume.","疲労が少ない状態で主セットの高重量を扱いやすい。":"Heavy practice occurs before accumulated working fatigue.","準備不足ではリスクが増え、主セット後は疲労しやすい。":"Requires sufficient preparation before the first work set.","挙上技術を習得した中上級者":"Experienced lifters with consistent warm-ups.","トップセットの達成と後続反復品質":"First-set quality and reductions across sets.","連続セットを短い反復群に分割し、群間に短い休息を入れる。":"Split a set into small clusters separated by short rests.","短いセット内休息で反復品質を維持":"Maintain movement quality during repeated efforts.","短い休憩で各反復の速度や質を保つ工夫ができる。":"Brief rests may reduce within-set fatigue.","セット時間が延び、機材やジム環境によって運用しにくい。":"More timing complexity; work remains demanding.","パワーや高品質反復を狙う人":"Trainees who can control rest timing.","反復ごとの速度低下・動作品質・総反復を比較":"Cluster size, intra-set rest and speed if measured.","単純に総量を増やす手段として使わない。":"End a cluster when movement quality deteriorates.","セット終了後に重量を下げて追加反復。使用頻度は限定して評価する。":"Reduce load after a main effort and continue repetitions.","負荷を下げて連続的に反復を行う":"Add local muscular work with a lighter load.","追加反復を短時間で確保する選択肢になる。":"Time-efficient additional volume.","局所疲労が増えやすく、通常セットの代替を保証するものではない。":"Local fatigue may obscure deteriorating technique.","局所的な筋肥大刺激を工夫したい経験者":"Experienced trainees using an appropriate exercise.","総反復、回復、翌日の疲労を比較":"Each drop, reps and technique.","疲労が大きくなりやすく、常用・痛み下での実施は避ける。":"Avoid unsupported failure and repeated painful repetitions.","短い休息のあとに少数反復を追加し、品質が低下したら終了。":"Add short rests between small groups of extra repetitions.","短い休息を挟み反復を追加する":"Extend an effort with brief recovery intervals.","短い休憩で追加反復の機会を確保できる。":"Compact high-effort work.","限界付近の反復が増え、回復に影響する可能性がある。":"High fatigue; not interchangeable with ordinary sets.","フォームを保てる単関節・補助運動など":"Experienced trainees using controllable exercises.","追加反復の品質、負荷耐性、回復":"Initial reps, rest duration and additional reps.","最大挙上や技術的に危険な動作では慎重に扱う。":"Do not use repeated failure when technique or symptoms worsen.","例：引く種目と押す種目を組み合わせ、間に必要な休憩を入れる。":"Pair two exercises with planned rest around the pair.","限られた時間内で複数種目を組み合わせる":"Organize time and complementary work.","二種目をまとめて実施し、時間効率を改善しやすい。":"Can reduce session duration.","疲労の強い種目を組み合わせると後半の質が落ちることがある。":"Exercise interference can reduce performance.","補助種目の効率を高めたい人":"Trainees who can maintain technique in both exercises.","各種目の反復品質と時間、疲労を比較":"Exercise pairing, rest and actual reps.","技術の難しい高重量種目の直前に過度に疲労させない。":"Use enough rest for demanding or technically complex lifts.","下ろす局面や減速局面を制御する補助運動から開始。":"Emphasize control during the lowering phase.","筋が伸びながら負荷を制御する能力を育てる":"Practice eccentric control and load tolerance.","筋が伸ばされながら力を出す局面を重点的に練習できる。":"Makes lowering tempo explicit.","高い張力や筋肉痛が生じやすいため、過負荷を急がない。":"Novel eccentric loading can cause substantial soreness.","減速・着地・筋腱負荷への段階適応":"Trainees progressing gradually in a familiar movement.","同一条件で減速安定性、痛み、翌日反応":"Lowering duration, load and soreness over days.","筋肉痛が強くなりやすい。高負荷の導入速度に注意。":"Increase unfamiliar eccentric work conservatively.","壁押し・保持・角度別の静的収縮を利用。":"Hold force at a defined joint angle for a planned duration.","関節を大きく動かさず力を発揮する":"Practice angle-specific force or positional control.","関節角度を限定して筋力発揮を練習できる。":"Makes hold position and time measurable.","実施した角度での適応が中心になり、全可動域の練習は別に必要。":"Adaptation can be angle-specific; breath holding adds strain.","特定角度での力発揮や支持を練習したい人":"Trainees with a clearly defined position and setup.","保持時間・角度・痛み・動作への転移":"Joint position, duration and effort.","息こらえや過度の血圧上昇を避ける指導が必要。":"Breathe normally and stop if symptoms appear.","低い弾み→連続跳躍→方向変更へ進み、接地と反発を観察。":"Practice jumps and landings with controlled contact volume.","伸張短縮サイクルを使う跳躍・反発の技能":"Develop rapid force production and landing skill.","素早い伸張—短縮の動作を練習できる。":"Links take-off and landing quality.","着地衝撃があるため、段階づけと十分な休息・床面条件が必要。":"Contacts add impact load and require space.","着地制御が安定し段階的に跳躍を増やせる人":"Trainees with suitable landing control.","接地時間、跳躍高、着地安定性、痛み":"Contacts, landing quality and rest.","成長段階・腱症状・疲労・着地能力に応じて導入。":"Progress impact gradually; pain or poor landings call for stopping.","バーや器具の実測速度を使い、負荷や疲労を調整する。":"Use genuinely measured lifting velocity under a defined protocol.","速度に基づいてその日の負荷設定を判断する。":"Review load and fatigue using velocity data.","速度低下を定量化し、主観だけに頼らない判断材料となる。":"Offers movement-speed feedback.","速度計測器が必要で、種目・測定方法によって精度が変わる。":"Requires suitable validated measurement; estimates are not readings.","速度センサーを利用できる指導環境":"Lifters with a compatible velocity device.","平均挙上速度・速度低下・反復間のばらつき":"Measured velocity, load and protocol.","高負荷の運動と軽負荷・爆発的運動を組み合わせる。":"Pair a heavier movement with a related explosive action.","大きな力と素早い力発揮を練習する。":"Practice force and speed in a planned pairing.","強度差のある刺激を意図的に配置できる。":"Combines distinct movement demands.","疲労で爆発的動作の質が落ちる場合があり、即時効果は個人差が大きい。":"Fatigue may outweigh any short-term performance benefit.","基礎筋力と動作技能のある競技者":"Experienced trainees with good explosive technique.","ジャンプ・速度・接地などの実測結果":"Pairing, rest and measured jump or speed output.","例：設定した回数範囲の上限に達したら、次回は重量を少し調整。":"Increase reps within a range before increasing load.","回数と重量を段階的に増やす":"Progress one variable at a time.","重量だけでなく回数達成も進歩として記録できる。":"Simple, observable progression criteria.","回数上限ばかり追うとフォームの質や痛みを見落としやすい。":"Rep improvement alone does not guarantee recovery.","筋肥大・基礎筋力を安全に積み上げたい人":"Trainees with a defined rep range.","反復回数、RIR、可動域、痛みの変化":"Completed reps, load and target RIR.","可動域を狭めて回数だけ増やすことを避ける。":"Increase load only after meeting the range with sound technique.","下降・静止・上昇の時間を変え、同一負荷で動作と症状を比較。":"Specify lowering, pause, lifting and pause durations.","動作時間を調整し制御を学ぶ":"Practice control through defined movement phases.","反復テンポを一定にして実施条件を揃えやすい。":"Makes execution repeatable.","遅いテンポ自体に筋肥大の優越性は保証されない。":"Slower tempo changes load tolerance.","関節運動と負荷のかけ方を観察したい人":"Trainees learning movement control.","可動域、コントロール、速度、本人の感覚":"Four-part tempo, load and actual reps.","遅いほど優れているわけではなく競技速度との使い分けが必要。":"Do not equate slower movement with universally better results.","片脚支持→ステップ→ランジなどへ段階化。左右差の強制的なゼロ化は目的にしない。":"Train one side or leg at a time with suitable support.","左右それぞれの課題と支持能力をみる":"Observe each side's task-specific capacity.","左右個別の課題と動作差を観察しやすい。":"Allows side-specific practice.","バランス制約で扱える重量が下がり、全体の最大筋力とは別評価になる。":"Balance may limit load before strength does.","歩行・走行・ステップ・着地の個別能力を高めたい人":"Trainees who can use support safely.","支持時間、安定性、片側のパフォーマンス":"Side, load, stability and task performance.","左右差＝異常とせず、転倒リスクや課題に応じ支持物を利用。":"Side differences are not automatically abnormal; manage fall risk.","軽いメディシンボールスローなど、制御しやすい道具で実施。":"Move an appropriate load explosively under a safe setup.","負荷を速く動かし力発揮速度を高める":"Practice rapid force expression.","加速を意図した力発揮を反復できる。":"Focuses intent and execution speed.","速度優先で動作制御を失うと危険。競技動作に直結する保証もない。":"Needs space, equipment and a suitable release or stopping strategy.","基礎筋力と操作技能がある人":"Trainees with competent technique.","投射距離、速度、再現性":"Load, repetitions and speed only when measured.","投げる方向と周辺安全を確保。高速度＝高重量にしない。":"Never sacrifice safe deceleration or equipment control.","短距離の加速走で姿勢・接地・タイムを比較。":"Practice short accelerations with full enough rest.","初速を高める方向と接地を学ぶ":"Develop initial sprint acceleration skill.","加速局面の接地・姿勢・ステップを検討できる。":"Makes starting mechanics explicit.","加速のタイムは距離・スタート条件・路面に強く影響される。":"High force and surface conditions affect risk.","短距離、球技の走り出し":"Trainees prepared for sprint loading.","0–10mなど同じ距離のタイム、接地位置、痛み":"Distance, rest, surface and measured time.","疲労時に高速度反復を大量に重ねない。":"Progress sprint exposure and stop with pain or loss of control.","低速の減速→角度のある方向転換→競技反応課題へ段階化。":"Practice stopping and changing direction with planned approach speed.","止まる・切り返す能力を高める":"Develop controlled braking and redirection.","減速してから進行方向を変える技能に焦点を当てられる。":"Connects approach speed with movement control.","方向転換の実績は減速・再加速・技術が混在し、単一指標では説明できない。":"Fast entries increase braking demand.","バスケ、バレー、サッカー、テニス等":"Athletes prepared for directional work.","減速距離、方向転換時間、安定性、症状":"Approach speed, surface, steps and control.","膝の形だけでフォーム異常を断定しない。":"Begin at a manageable speed and avoid uncontrolled cutting.","短距離の反復と十分な回復を設計し、後半の落ち込みを確認。":"Repeat short sprints with defined work and rest intervals.","短い高強度運動を繰り返す能力を育てる":"Practice repeated high-intensity efforts.","短い回復を挟んだ繰り返し疾走能力を練習できる。":"Makes recovery demands observable.","高い疲労を招きやすく、連続した高強度日の設定に注意がいる。":"Fatigue reduces sprint quality and increases load.","間欠的な球技":"Prepared athletes with a clear conditioning purpose.","各本のタイム低下率、総距離、主観的疲労":"Sprint times, rest and quality decay.","競技練習との合計走行負荷と暑熱条件を管理。":"Stop when performance or technique drops beyond the planned limit.","会話できる程度など個人に合う継続強度で運動。":"Perform sustained aerobic work at an individually appropriate easy intensity.","比較的持続可能な強度で有酸素能力を育てる":"Develop sustainable aerobic conditioning.","比較的低強度で持久運動量を確保しやすい。":"Usually permits longer controlled practice.","ゾーン区分は個人差が大きく、心拍だけの固定値で処方しない。":"Zone definitions vary; a label is not a measurement.","長距離、自転車、基礎持久力":"Trainees with an appropriate activity and intensity reference.","同じ時間・主観強度での距離、心拍、回復":"Duration, talk test or measured heart rate.","心拍ゾーンは個体差があり推定値を絶対視しない。":"Do not invent heart-rate zones without a suitable basis.","適切に調整した一定時間のテンポ走・ペダリングを行う。":"Perform sustained or interval work near an individually assessed threshold.","継続できる比較的高い運動強度を伸ばす":"Practice tolerating a higher sustainable intensity.","一定以上の持続的努力を段階的に練習できる。":"Specific pacing practice.","頻度や時間を増やしすぎると回復負担や競技練習と干渉しうる。":"Threshold estimates and fatigue vary between days.","持久競技の中級者以上":"Endurance trainees with a known pacing reference.","一定ペースでの継続時間、RPE、回復":"Duration, pace, perceived effort and recovery.","レース前に過剰に詰め込まない。":"Reduce intensity when the planned pace is not sustainable safely.","短い運動と回復を繰り返す。強度・比率は対象に合わせて設定。":"Alternate higher-intensity work and recovery periods.","強弱を繰り返し高強度耐性を高める":"Develop tolerance for repeated hard efforts.","短時間で高強度の刺激を設計しやすい。":"Flexible work/rest structure.","高い心肺負担があり、頻度と回復を調整しないと継続しにくい。":"High fatigue; hard is not necessarily maximal.","基礎が整い高強度への適応が可能な人":"Prepared trainees using a suitable modality.","同一反復数でのペース低下、回復、症状":"Work duration, rest, completed bouts and effort.","未経験者・症状のある人へ一律の高強度処方をしない。":"Stop for concerning symptoms; increase exposure gradually.","量を減らしつつ競技特異的な短い刺激を残す。":"Reduce training volume before an event while retaining selected intensity.","疲労を減らし技能・強度を保って本番を迎える":"Manage fatigue approaching performance.","競技前の疲労を下げながら動きの質を確認できる。":"Preserves familiar practice while allowing recovery.","量を減らしすぎると準備感が下がる場合があり、期間や強度に個人差がある。":"An excessive reduction or late overload can undermine preparation.","大会直前の競技者":"Athletes with a known event date.","主観的回復、動きのキレ、練習タイム":"Event date, volume reduction and readiness.","ピーク直前に新しい高負荷プログラムを導入しない。":"Avoid novel hard work immediately before the event.","量・負荷・難度を状況に応じて減らし、技術練習を維持。":"Temporarily reduce training stress through load, volume or both.","蓄積疲労を管理し再び適応する余裕を作る":"Create recovery space before renewed progression.","累積疲労を整理し、次の練習に向けた余裕を作れる。":"A planned opportunity to reassess fatigue.","軽減が短すぎても長すぎても、目的に合わない可能性がある。":"A deload is not treatment for persistent pain.","疲労が積み重なるトレーニング期":"Trainees with a reason to reduce training stress.","疲労、睡眠、疼痛、次週の反復品質":"Reduced volume, symptoms and readiness trend.","休息期間を必ず固定週にするより本人の状態を優先。":"Persistent or concerning symptoms require appropriate assessment.","ホーム":"HOME","トレーニング":"TRAINING","栄養":"NUTRITION","ミラー":"MIRROR","コーチ":"COACH","アダプト":"ADAPT","成長を振り返るダッシュボード":"Your Growth Dashboard","当日の状況":"TODAY’S STATUS","選択日の状況":"SELECTED DAY’S STATUS","次の行動":"NEXT ACTION","週間の記録":"WEEKLY RECORD","機能への入口":"QUICK ACCESS","未記録":"Not recorded","未設定":"Not set","未連携":"Not connected","算出不可":"Unavailable","摂取":"Intake","消費":"Expenditure","差分":"Balance","歩数":"Steps","記録あり":"Recorded","トレーニングへ":"Go to TRAINING","食事画面へ":"Go to NUTRITION","回復記録へ":"ADAPT · Recovery log","運動":"Training","食事":"Nutrition","回復":"Recovery","対話":"Talk","記憶":"Memory","参照同意":"Record consent","振り返り":"Reflection","自由入力・会話":"Free input and conversation","保存・修正・削除":"Save, edit and delete","分野別・写真送信なし":"By category; no photos sent","本人選択・ADAPT保存":"Your choice; save to ADAPT","自由対話 / 記憶 / 本人の選択":"Conversation / Memory / Your choice","記録 / 振り返り / 本人承認":"Records / Reflection / Your approval","記録の充足":"Record coverage","記録・本人選択":"Records and your choice","身体・回復":"Body and recovery","測定・回復記録":"Measurements and recovery records","推移":"Trends","本人承認":"Your approval","次回候補・適用履歴":"Next candidate and applied history","過去の実AI接続成功記録を保全。現在の送信状態とは区別します。":"Historical real AI success is preserved separately from the current sending state.","痛み・条件不足は保留。本人承認なしに重量・食事設定を変更しません。":"Hold for pain or insufficient evidence. Loads and food targets never change without your approval.","保存済み実AI応答の再表示・新規通信なし":"Recorded real AI response; no new request","模擬AI・実API通信なし":"Mock AI; no real API request","応答形式の模擬検証・実API通信なし":"Response-format fixture; no real API request","オフライン・新規AI応答の送信は無効":"Offline; new AI requests are disabled","オフラインです。入力と記憶の管理は利用できます。新しいAI応答は送信しません。":"Offline. Input and memory controls are available; no new AI response is requested.","指導者向けメモ・共有下書き":"Notes and sharing drafts for a human coach","記録・回復・推移・本人承認の全機能":"All record, recovery, trend and approval controls","既存記録・目的・データ管理":"Existing records, goal and data management","既存の入力・方式・計算・全履歴":"Existing input, methods, calculations and full history","既存の食事入力・計算・献立・戦略":"Existing food entry, calculations, menus and strategies","比較条件・既存の説明":"Comparison conditions and existing guidance","固定UIのみ切替":"Switch fixed UI only","入力・履歴・セット詳細":"Input, history and set details","週間プラン / 30方式":"Weekly plan / 30 methods","TM・週別重量":"TM and weekly loads","日付一覧・日付フィルター：未実装。以下は保存済み履歴（全日付）。":"Date list and date filtering are not implemented. Saved history below includes all dates.","記録なし":"No records","確認済み詳細セット数":"Confirmed detailed sets","保存記録件数":"Saved entries","記録状態":"Record status","詳細・一括を区別":"Details and summaries distinguished","トレーニングフロー（30方式）":"TRAINING FLOW · 30 METHODS","方式を選ぶ":"Choose a method","4分類・30方式":"4 categories; 30 methods","解説・設定":"Explanation and setup","名称＋7項目の解説":"Name and 7 explanation fields","実施記録":"Workout log","重量・回数・セット・RIR・テンポ":"Load, reps, sets, RIR and tempo","分析":"Analysis","履歴・前回比較・推移":"History, previous comparison and trends","その他の機能":"OTHER CONTROLS","既存種目の選択":"Select an existing exercise","記録入力へ":"Go to entry","履歴・前回比較":"History and previous comparison","分析へ移動":"Go to analysis","設定":"Settings","目的・経験・確認条件":"Goal, experience and checks","推定1RM · Epley / Brzycki":"Estimated 1RM · Epley / Brzycki","既存計算式を使用。計算のみで実績・TM・週間計画は変更しません。":"Uses the existing formulas. Calculation never changes records, TM or weekly plans.","回数（1〜10）":"Repetitions (1–10)","計算":"Calculate","閉じる":"Close","未算出":"Not calculated","入力変更・未算出":"Input changed; not calculated","食事管理 / PFC / 栄養戦略":"Food records / PFC / Nutrition strategies","カラダの変化を見える化 / 写真比較・測定記録":"Track body changes / Photo comparison and measurements","今日の栄養バランス":"TODAY’S NUTRITION","摂取カロリー":"Energy intake","PFC（目標 / 摂取 / 差）":"PFC (target / intake / difference)","水分":"Water","食物繊維":"Fibre","収支":"Energy balance","消費未連携":"Expenditure not connected","未対応":"Not available","入力した食品の概算。未記録分を補完しません。日付を指定した食事入力は下の記録フォームで行えます。":"Estimates from logged foods only; missing intake is not filled in. Use the original form below to enter a food date.","食事の記録":"FOOD RECORDS","朝食・昼食・夕食・間食の分類保存：未実装。保存済みの食事記録を分類したようには表示しません。":"Breakfast, lunch, dinner and snack categories are not saved. Existing food records are not presented as classified meals.","食品選択・数量入力":"Select food and quantity","既存カタログから記録":"Log from the existing catalogue","写真で記録":"Log from photo","AI写真入力：未対応":"AI photo input: not available","目的・設定・戦略メニュー":"GOALS, SETTINGS AND STRATEGIES","目標設定":"Set targets","体重・kcal・PFC":"Weight, kcal and PFC","栄養戦略":"Nutrition strategies","9種類":"9 strategies","大会調整":"Event planning","大会日程・栄養戦略":"Event date and nutrition strategy","履歴・削除":"History and deletion","食事記録へ":"Go to food records","参考献立":"Sample menu","目的別メニュー参考":"Goal-based menu ideas","クイックメニュー":"QUICK MENU","PFC計算":"Calculate PFC","kcal → PFC":"kcal → PFC","カーボアップ":"Carb-up","栄養戦略へ":"Go to nutrition strategies","目的別食事例":"Goal-based meal examples","再登録":"Re-register","よく使うメニュー：未対応":"Frequent-menu re-entry: not available","測定比較":"Photo comparison","測定記録":"Measurements","体重・腹囲":"Weight and waist","ADAPTの記録比較":"Compare records in ADAPT","目標・プランへ":"Goals and plans","写真比較":"PHOTO COMPARISON","写真は比較用の一時利用。画面を離れると破棄し、永続保存・AI送信はしません。重ね合わせは既存の表示範囲スライダーです。":"Photos are temporary comparison data. Leaving the screen discards them; they are never persisted or sent to AI. Overlay uses the existing reveal slider.","身体測定の記録":"BODY MEASUREMENTS","写真を選択":"Select photos","測定を記録":"Record measurements","推移を確認":"Review trends","ADAPTのグラフ・一覧":"Graphs and records in ADAPT","ADAPTへ":"Go to ADAPT","本人が次の行動を検討":"You choose the next action","記録":"Log","食事入力":"Food entry","目標設定・計算":"Targets and calculation","食事例":"Meal ideas","目的別・参考献立":"Goal-based sample menus","ADAPTで振り返る":"Review in ADAPT","自分の言葉で振り返る":"Reflect in your own words","選択した記録を含める":"Include selected records","今の気持ち":"How I feel","本人の選択":"My choice","まだ分からない":"Not sure yet","悔しい":"Frustrated","不安":"Anxious","自信がある":"Confident","落ち着いている":"Calm","まだ決めていない":"Not decided","続ける":"Continue","調整する":"Adjust","休む":"Rest","考え続ける":"Keep reflecting","痛み":"Pain","未回答":"Unanswered","いいえ":"No","はい":"Yes","現在の回復状態":"Current recovery","良好":"Good","通常":"Normal","不良":"Poor","目標RIR":"Target RIR","自分の言葉で自由に入力":"Your thoughts, in your own words","保存済み実AI応答を読み込む":"Load recorded AI response","準備済みCOACHを模擬検証":"Test prepared COACH","模擬COACHと対話":"Talk to mock COACH","この対話を破棄":"Discard dialogue","COACHで続ける":"Continue in COACH","選択した後、何に気づきましたか？":"After making my choice, what did I notice?","振り返りをADAPTへ保存":"Save reflection to ADAPT","処方・運動記録は変更しません。振り返りは本人の明示操作で保存します。会話と記憶の保存範囲は以下で選択します。":"No prescription or training record is changed. Reflections save only when you choose. Conversation and memory retention are controlled below.","記憶と記録の参照設定":"Memory and record permissions","会話履歴をこのブラウザーに保存":"Keep conversation history on this browser","記憶メモを保存":"Keep my memory notes","選択した記憶をCOACHの文脈に使う":"Use selected saved memory in COACH context","保存済みADAPTの振り返りを参照":"Include previous saved ADAPT reflections in memory context","「選択した記録を含める」で許可する分野":"Record categories allowed when “Include selected records” is checked","TRAINING：直近のセット・RIR・痛み":"TRAINING: recent sets, RIR and pain","NUTRITION：直近の食品ID・数量・日付":"NUTRITION: recent food IDs, quantities and dates","MIRROR：測定値のみ・写真なし":"MIRROR: measurements only; no photos","ADAPT：本人選択・レビュー・次回計画・回復":"ADAPT: saved choices, review, next plan and recovery","COACHに覚えておいてほしいこと":"What I want COACH to remember","記憶の選択内容を保存":"Save memory selections","このブラウザーのCOACH記憶を削除":"Delete local COACH memory","COACH記憶の削除を確定":"Confirm delete local COACH memory","ADAPTへ明示保存するとき、対話原文も含める":"Also include dialogue text when I explicitly save a reflection to ADAPT","修正を保存":"Save correction","この振り返りを削除":"Delete this saved reflection","振り返りの削除を確定":"Confirm delete this reflection","保存済みCOACH → ADAPTの振り返り":"Saved COACH → ADAPT reflections","ここに保存する範囲を選べます。最大32発言を保持し、直近8発言まで文脈に使います。自動送信はありません。個人を特定する情報は避けてください。バックアップ時に選択するとCOACH記憶をJSONへ含められます。":"Choose what stays on this browser. Recent 32 messages can be saved; up to 8 recent messages are sent as context. No automatic external sending. Avoid identifying details. COACH memory can be included in your JSON backup when you select it in the backup dialog.","以下の保存済み会話を確認・修正し「記憶の選択内容を保存」で反映します。保存を外した分野はCOACH記憶から削除されます。":"Review or correct saved conversation text below. Apply changes with Save memory selections. Unchecking retention removes that category from saved COACH memory.","ADAPTの振り返りは明示操作で別に保存します。COACH記憶を削除しても消えません。以下で確認・修正・削除できます。":"ADAPT reflections are saved separately by your explicit action. Deleting COACH memory does not delete them. Review, correct or delete them below.","応答が完了してから記憶を変更してください。":"Wait until the current response finishes before changing memory.","選択した記憶設定をこのブラウザーに保存しました。":"Your selected memory settings are saved on this browser.","COACH記憶を削除しました。ADAPTの振り返りと身体記録は保持しています。":"Local COACH memory deleted. Saved ADAPT reflections and body records are unchanged.","記憶を再読込しました。":"Saved memory reloaded.","振り返りはまだ保存されていません。COACHで本人選択と振り返りを保存すると、ここに保持されます。":"No saved reflections yet. Save a choice and reflection in COACH to retain it here.","理由：":"Reason:","言語":"Language","設定とデータ":"Settings and data","主要画面":"Main screens"});
const ordered=Object.keys(dictionary).sort((a,b)=>b.length-a.length);
function translate(s){let out=s
.replace(/入力された食事の合計 ([\d,]+) kcal。現在設定した目標 ([\d,]+) kcal\/日。未入力の食事がある可能性があるため、摂取不足・超過とは判断しません。/g,'Logged intake: $1 kcal; current target: $2 kcal/day. Records may be incomplete; intake adequacy is not assessed.')
.replace(/目標([\d,]+)kcalに対し、入力分は約([\d,]+)kcal。未記録の食事があれば、1日の摂取量全体とは一致しません。/g,'Target: $1 kcal; logged intake: about $2 kcal. Missing meals mean this may not be the full daily intake.')
.replace(/両週それぞれ異なる日付の体重測定が2日以上必要／両週とも食事記録が5日以上必要／目標を減量・増量・維持から選択/g,'Requires two measurement days and five food-log days in each week, plus a fat-loss, hypertrophy or maintenance goal.')
.replace(/この献立例の合計は約([\d,]+)kcal。目標kcalと自動で一致させていません。食品成分は試作用概算値であり、精密な栄養計算や医療用食事指導には使用しないでください。/g,'This menu totals about $1 kcal and is not automatically matched to your target. Food values are approximate prototype data, not clinical nutrition guidance.')
.replace(/直近7日（([^）]+)）と前7日（([^）]+)）を比較。入力されていない日は「未記録」とし、ゼロ摂取・休養と決めつけません。/g,'Compare the latest 7 days ($1) with the preceding 7 days ($2). Missing entries do not mean zero intake or rest.')
.replace(/前週 (\d+)日 · 記録SET (\d+)（前週 (\d+)）/g,'Previous week: $1 days · sets $2 (previous $3)')
.replace(/記録済み日の平均 (.*?) ／日/g,'Mean on logged days: $1 / day')
.replace(/食事の記録率 (\d+)\/(\d+)日/g,'Food coverage: $1/$2 days')
.replace(/運動の記録率 (\d+)\/(\d+)日/g,'Training coverage: $1/$2 days')
.replace(/入力された食事の合計 ([\d,]+) kcal。未入力の食事がある可能性があるため、摂取不足・超過とは判断しません。/g,'Logged food totals $1 kcal. Missing meals may exist; intake adequacy is not assessed.')
.replace(/入力した実施記録 (\d+)件、総SET (\d+)。加重挙上量 ([\d,]+) kg（重量入力のある種目のみ、能力指標ではありません）。/g,'$1 training entries, $2 sets, $3 kg recorded volume. This is not a performance score.')
.replace(/食事記録のない日が(\d+)日あります。1日の全食事を入力したか確認。/g,'$1 days have no food entries. Check whether each day includes all meals.')
.replace(/異なる日の体重測定がまだ2件ありません。MIRRORで日付付き記録を追加できます。/g,'Two separate measurement days are required. Add dated entries in MIRROR.')
.replace(/今週の回復記録は(\d+)\/(\d+)日。未記録日を問題なしとは扱いません。/g,'Recovery coverage: $1/$2 days. Missing days are not assumed to be fine.')
.replace(/食事を入力した日：(\d+)\/(\d+)日／回復を記録した日：(\d+)\/(\d+)日／体重を測定した日：(\d+)\/(\d+)日。/g,'Food: $1/$2 days / recovery: $3/$4 days / weight: $5/$6 days.')
.replace(/(\d+)日測定 · 食事(\d+)\/(\d+)日/g,'$1 measurement days · food $2/$3 days')
.replace(/運動記録 (\d+)日 → (\d+)日/g,'Training record days: $1 → $2')
.replace(/変更前 ([^。]+)。維持案を選択中。変更はまだ行いません。/g,'Current target: $1. Maintain selected; no change applied.')
.replace(/未入力の材料：[^。]+。記録が揃っていない場合、効果・原因・優劣は判定しません。/g,'Some review evidence is missing. Incomplete records do not support claims about effect, cause or superiority.');
for(const key of ordered)if(out.includes(key))out=out.split(key).join(dictionary[key]);return out.replace(/(\d+)件/g,'$1 entries').replace(/(\d+)日前/g,'$1 days ago').replace(/(\d+)週間/g,'$1 weeks').replace(/(\d+)週/g,'$1 weeks').replace(/(\d+)日/g,'$1 days').replace(/(\d+)回/g,'$1 reps').replace(/(\d+)[個本]/g,'$1 portions').replace(/約(?=\d)/g,'About ').replace(/^件$/,'entries');}
const fixedSourceTexts=new Set(["+ 運動を記録","/ 7日","1週間の数字だけで決めない。","2日以上測定の週","30方式の評価・負荷計算","30方式の説明と実施記録を確認できます。自動計算に対応する範囲は方式ごとに異なります。","30方式の負荷計算 ↓","30種類から選択可能。5/3/1・5×5には重量計算、DUP・RPE/RIRには基本プレビューを搭載。各方式の週間配置例を作れます。5/3/1・5×5のみ主種目の重量を計算。その他の技法は例示であり、測定・自動処方ではありません。","5/3/1 — Training Maxを基準に計算","5/3/1・5×5は主種目の重量も計算。それ以外はセット技法を含む週間配置例です。実際の処方は体調・練習歴・環境に合わせて確認します。","5×5：各セットの保存記録で判定","5セット個別の記録がありません。TRAININGの「記録・履歴」→「セット詳細を入力」で各セットを記録してください。","5回 × 5セット","90分以上の長時間持久系競技に対する成人の一般的参考範囲（10〜12 g/kg/日）。高い摂取量が必ず適切とは限らず、胃腸の耐性や運動量・体調を確認して専門家と調整。入力した食事プランへは反映しません。","90分未満の競技では典型的な高糖質ローディングを前提にしません。通常の食事と試合前後の補給を優先。","ADAPTで次回予定を確認","ADAPT承認済みの次回予定","BIG3 ANALYZER：連携構想","BODY・HealthKit・リング・コーチとの実通信は未接続。記録の保存状態はこの端末のブラウザーに依存します。","BODY：連携構想","COACH：未接続","JSONを書き出す","RIR 2は「あと約2回できる感覚」。負荷調整には実際のフォーム、疲労、痛み、目標を合わせて確認する。","S.u.G EVOLINK｜正式ロゴ・6画面統合検証候補","SETS 記録済","TRAININGで今回計算した候補（未保存）","TRAININGで負荷を比較","eVo既存18＋BODY PRISMの追加12／重複除外","。ここに書いても指導者には届きません。ファイル書き出しは利用者が明示操作した場合のみ。","あり（負荷を再検討）","ここから。","このトレーニング法を選ぶ理由","この履歴は端末内保存のみ。本人の明示的なJSON書き出しを除き、コーチへの送信や外部共有は行いません。","この条件で週間プランを保存","この画面では増量候補を新規に確定しません。TRAININGで計算後、同じデータに基づく結果を表示します。","この端末の記録を消去","これは教育目的の献立構成例であり食品量の確定処方ではありません。未成年や持病・服薬・体重階級に関する調整は適切な専門家と行ってください。","これは記録の比較で、脂肪減少・筋肥大・栄養不足の診断ではありません。食事量や重量の自動変更、コーチへの送信は行いません。","その他","たんぱく質 P","たんぱく質設定（g/kg）","なし","まだメモはありません。","まだ回復記録はありません。","まだ変更案・適用履歴がありません。履歴はこれから保存した操作だけを表示します。","まだ文面は生成していません。含める情報を選び、生成後に内容を確認してください。","まだ週間プランを保存していません。まず実施例を作ってください。","まだ食事の記録がありません。","もっと進化する。","カテゴリ","カラダをつくる。","カーボローディング・コンテストのピークウィーク中は通常の週次カロリー変更と区別します。未成年や個別の健康問題がある場合には、この試作の数値変更機能を自己処方として使わないでください。","カーボローディング＝長時間競技のエネルギー準備。カーボアップ＝コンテストなどでの身体の見え方の調整。どちらも一律処方はしません。脱水・利尿・塩分制限による急速減量の自動プランはありません。","クリップボードへのコピーはブラウザーの対応・許可が必要です。自動送信・自動共有なし。写真・体重測定値そのものは収録しません。","コンテストのカーボアップは持久系の「10〜12 g/kg」を転用しません。まず練習時の試行データ、本人の体重・写真・胃腸状態を確認します。自動の水分・塩分操作はありません。","ショルダープレス","スクワット","セッション終了時の疲労（自己申告）","セットRIR平均","セットごとの重量・REP・RIRまたは違和感が一括記録と異なります。詳細ログで確認してください。","セット別の記録を2回分入力すると、同じ種目の前回・今回を比較できます。","セット単位のテンポは自己申告。速度・関節角度の測定ではありません。入力内容はコーチへ自動送信されません。","セット単位の記録はまだありません。TRAININGの履歴から入力できます。過去ログの重量・RIRを自動補完しません。","セット実績を入力・確認","セット数が異なるため、セット番号ごとの直接比較は表示しません。","セット詳細がある記録はセットごとの重量×REPを集計し、なければ一括入力の重量×REP×SETを使用。全種目表示では異なる種目が混在するため、トレーニング成果の直接比較はできません。","セット詳細を削除","チャートには2件以上の記録が必要です。","デッドリフト","デメリット・限界","データの管理","データ削除（要確認）","トレーニング","トレーニングを記録","トレーニングマックス（TM）は一般的な設定例として推定1RMの90%を使用します。重量は2.5kg刻みの目安。実施重量・回数はフォームや状態で調整。","トレーニング日","トレーニング計画を見直す","バックアップを読み込む","フォームの自己評価","ベンチプレス","ボタンを押したときだけ新規作成。既存の運動記録・重量・食事目標は変更しません。","ボディコンテストへの持久系ローディング数値の転用は禁止。水抜き・利尿・急速減量は自動提案しません。","メモだけ","メモ＋運動要約","メリット","ラットプルダウン","レッグプレス","下書きを保存（送信しない）","不安定・未確認","並列比較","主方式だけでなく、併用した技法を最大3つまで記録。何も選んでいない場合は推測しません。","主方式と併用技法の組合せごとに実際の記録を集計。平均RIR・セッション疲労・同日の睡眠情報を照合する。未入力は「回復良好」と扱わない。","主種目","今回の実挙上量","今回実際に使った方式・技法","今回重量","今日のコンディションを記録","今日のトレーニング","今日のトレーニングを記録 →","今日の余力を確認する","今日の運動を記録 →","今週のサマリー →","仮の増量幅","件","休養日","伝えたいこと・質問","体重と1日の目標エネルギーを入力すると、PFCの配分例が表示されます。","体重と期間","体重と目標kcalの設定後に、献立例とのPFC差を参考表示します。","体重を記録","体重を記録した週","体重・運動・食事の入力が何週間続いているか確認。体重平均は同じ日の最新測定値を1日分として集計し、欠測週の値は作りません。","体重平均","体重平均の差は体脂肪や筋肉量の変化を示しません。食事記録がない日は0 kcalとは解釈しません。比較する週の測定条件を揃えてください。","体重（実測入力）","併用技法付きの運動ログはまだありません。過去記録を自動で補完しません。","保存された5セット","保存した検討案と、本人が明示適用した変更を時系列で表示。過去の設定値を推測・補完せず、履歴から自動復元もしません。","保存先はこのブラウザーのlocalStorageです。写真は保存対象外。端末変更時にはJSON書き出し・読み込みが必要です。","保存状態を確認","個人で確認してからテキストをコピーできます。写真や身体測定データは含めません。","入力日のみの概算","全種目","全種目（方式別実施状況）","共有前に、内容を自分で確認。","共有範囲（書き出し時のみ）","内容を生成して確認","再評価へ →","再評価を見る →","写真を破棄","初期状態は運動記録のみ。写真・名前・住所は含めず、食事や回復はチェックした場合にのみ含めます。データは送信されません。","別案に切替","削除","前7日・体重平均","前回の実挙上量","動作の質も確かめる。","参考情報：1〜2.5時間程度の持久性・断続的競技では、運動中の糖質補給が30〜60 g/時とされる場面があります。連続運動時間・休憩・競技規則・胃腸の耐性に合わせて検討します。","参考糖質量／日","各セットを確認して保存","同じトレーニング履歴を参照。回復情報の自動連携は未実装。次回の候補は本人確認が必要。","同じ方式を主方式と併用欄の両方に記録しない。トレーニング方式（週単位）とセット技法（種目単位）は別の概念です。","同じ日付の記録は保存確認後に更新します。日々の記録だけで運動の安全性・効果を断定しません。","同じ条件で写真を比較し、身体の変化を確かめる。写真はこのタブを離れると破棄され、保存・送信しない。","同じ種目の記録が2件以上あれば、前回と今回の条件を比較できます。","同一種目の別日2記録を照合。数値は例示ルールによる候補で、専門家の処方や測定済みの回復度ではありません。自動変更は行いません。","同一種目・REP・SETの異なる日付の記録が2件以上なく、重量比較は保留。","同期間の参考情報（方式ごとの因果関係ではありません）","向いている場面","回","回復との整合","回復・体調","回復状態（本人による確認）","回復記録なし（BODY自動連携なし）","回数またはセット数が違います。総挙上量のみで成果を断定しません。","基本種目 × 5セット × 5回","増量候補幅（kg）","変更幅（食事の場合のみ）","外部への送信・同期はありません。","大会形式と体重・競技時間を入力して保存すると、競技別の参考情報を表示します。食事目標は自動更新しません。","大会情報を保存・参考計画を表示","安定していた","実施ログ","実施技法（任意）","実施日","実施時に方式を選んだ運動記録だけを集計。トレーニング効果の因果判定・方式の優劣ランキングはしません。","実施記録はありません。入力した実データだけを保存します。","実績がありません","実記録挙上量","実際に併用した技法","実際に食べた物を記録 →","実際の書込み・読込みは「保存状態を診断」で確認できます。ブラウザー終了・再起動後の保持は別途確認が必要です。","対象期間","対象種目","対象種目の重量記録なし","対象種目（入力済み履歴）","将来はBIG3 ANALYZERと連携し、ROM・REP・速度・バー軌道を扱う。ここには、未測定の角度や筋活動率を表示しない。","差は食品カタログの概算値と入力された目標との算術比較で、食事処方ではありません。献立の分量を自動変更していません。","平均RIR","強い・回復優先","性別（任意：一律補正には使用しない）","意味・やり方","承認時だけ「次回予定」に登録。5/3/1のTMや週間プラン、過去の実施ログは変更しません。実行済みとみなす処理もありません。","承認済み次回予定を削除","持ち出し用の共有テキスト","持久系の糖質ローディングはHPRC（2026年）、競技中の補給はAIS、競技美のピーク調整は2024年レビューと2026年のトレーニングレビューを参照。競技美の糖質操作は効果を断定できるほどの実験的証拠がなく、少数の変数を事前に試す方針。","指導者向けの確認メモ","挙上量の変化","推定 C","推定 F","推定 P","推定 kcal","推定1RMを入力すると、各セットの計算例が表示されます。初期値や架空の重量は入れていません。","撮影条件が異なれば見かけの変化を誤認します。写真だけで筋肉量・体脂肪率・体調を測定したとは表示しません。","数字を見てから、次の一週間を決める。","新しく作成するまで保存した計画は変更されません。","方式未指定","方式未指定・組合せ不明","方式記録あり","方法A・B｜メリットとデメリット","方法の得失は条件付き。どの方式が最適かは目的・経験・回復状況と記録で再評価します。","方法を選択してください。","日時と競技時間は本人が入力。結果を表示しても、通常のPFC目標・献立・食事記録は勝手に変更されません。","時間","普通・回復を確認","最大20件の過去レビュー＋最新レビューを表示。STAGE 10より前の未保存の設定変更は追跡できません。日時は保存された記録値です。","最大入力重量","最新RIR","期間内に「方式を指定して保存した運動記録」がありません。旧記録に方式を自動付与しません。","未入力の旧ログには数値を推定しません。空欄には各セットの実際の値を入力してください。元の一括サマリーは変更せず、詳細値は別に保管します。実際に確認した値だけ保存してください。","未来の身体が変わる。","未評価（ADAPTでは判断保留）","未連携・未計測","本人が入力したRIRから、再評価画面に参考コメントを表示できます。","本人・指導者が決めた変更理由","本人・指導者が確認した根拠と理由","本日入力した食品の概算です。未入力分は推定しません。","栄養目標","栄養目標を計算・保存","検討案を取り下げ","次の一手","次の力になる。","次回の確認ポイント","次回の負荷変更は保留し、フォーム・体調・休養を確認する材料にしてください。自動で重量を変更しません。","次回候補","次回負荷の判断材料","次週の検討内容","正しいフォームで、理想の身体へ。","比較したい種目を上のチップから選んでください。種目が混ざった状態では直接比較しません。","比較する種目","比較は教育用です。選択・比較しても週間計画や学習履歴を自動変更しません。","比較保留：","比較前の写真を選択","比較可能な週平均の差","比較対象方式","比較後の写真を選択","測定日","測定記録を保存","炭水化物 C","現在の目標","現在の記録では新しい判断は保留です。既存の承認済み予定も実施前に再確認してください。","現在はコーチ未接続。相談メモと共有用文章を作成できるが、コーチへの送信はできない。","現在：未接続","現状を維持","生成した共有文面（編集・選択可）","異なる種目を合算した挙上量は筋力比較に使えません。方式の切替時には期間・種目・経験・睡眠・栄養・痛みなどの条件が変わるため、優劣や効果を断定しません。複数方式を組み合わせた場合は判定できません。","痛み・違和感","痛み・違和感、またはフォーム未確認の申告が含まれています。負荷増量の判断を行いません。","痛み・違和感あり","目安の期間","目標 kcal","目標kcalを増やす","目標kcalを減らす","目標に応じてトレーニングと食事を設計します。","目的","目的別の食事プランと摂取記録。kcal・PFCは設定値と参考食品値をもとに集計する。","目的（提案の計算条件）","直近7日とその前7日の体重平均・食事の記録日数・運動実績を並べる。体重は同日複数回測定しても1日分だけ集計。変化の原因や体脂肪量を推定しません。","直近7日・体重平均","直近7日・入力した食事量","睡眠・回復の自己申告を含める","睡眠時間と主観的な感覚を記録する。医学的な回復スコアやHRVの実測値は生成しません。実施日の前後を混同しない日付照合を行います。","確認した実績からのみ計算します。「計算・比較する」で結果を表示します。数値は自動保存しません。","確認してNUTRITION目標へ反映","確認する指標","確認チェックを解除","確認記録のみ参照。計算ボタンは読み取り専用で、保存済み記録・週間プラン・ADAPTの候補を自動上書きしません。BODY・センサーのリアルタイム連携は未実装。","種目","種類","競技・コンテスト種別","組み合わせたとき、何を記録した？","経験","結果","継続が、","継続が、理想の身体をつくる。","総挙上量","総挙上量（入力分）","脂質 F","脂質配分","自分には、どの方法が合っていた？","自分に合う方法を、選ぶ。","自分の進化を記録。","自動の必要カロリー算出ではありません。本人・専門家が設定したkcalをPFCに配分する試作。体重・年齢・競技量などに基づく必要量の評価、体調確認は別途必要です。","表示中の文面をコピー（送信なし）","計画をコピー","計算・比較する","計算候補であり自動処方・実測センサー値ではありません。本人または指導者が確認するまで既存計画・記録を変更しません。","計算対象の運動記録がまだありません。","計算結果は提案候補。BMI・性別による一律の重量補正はせず、未確認データから増量を自動確定しません。","記録から、次の行動を考える。","記録から次回重量を検討する","記録がつながると、変化が見える。","記録なし。セット実績を推定しません。","記録の充足","記録は入力した時点の簡易記録です。個別の食材量・銘柄・調理法で大きく変化します。","記録を振り返る","記録セット数","記録・履歴でセット詳細を入力","記録・目標・日付の変化があり、保存時の根拠が古くなっています。新たに検討案を作り直してください。","設定・データ管理","設定・データ管理を閉じる","負荷や食事を自動で増減しません。提案ではなく見直し候補を表示し、反映には利用者の明示操作を必要とします。","負荷差は能力向上や方式の効果を証明しません。RIR・フォーム・疲労の違いを確認してください。","身体づくりの目的","身体の変化","身体測定","軽い・余力あり","通常の食事計画に戻る","週の回数","週の選択","週・フェーズ","週内で刺激を変える","週平均どうしの差","週末","週間プランやTMの計算は変更されていません。実施時に実際の内容を記録してください。","週間配置例は下の「週間プラン作成」で表示できます。種目別の自動負荷設定は行いません。","進化する。","進化をつくる。","進行例を表示","運動した記録日","運動を記録する","運動ログ","運動・栄養・見た目・指導をひとつに。自分の記録から、次の行動を考える。","運動・食事の記録漏れと測定条件を自分で確認した","運動・食事・身体と入力された回復情報を振り返り、次の候補を考える。未記録は推測で埋めない。","運動記録","運動記録日","違和感","選ぶ・記録する・振り返るを、ひとつに。","選んだ方式で、1週間の実施例を組む。","選択した負荷調整方式の意味","選択方式：","選択期間に体重記録がありません。記録のない週を推定値で埋めません。","重ね合わせ比較","重量を計算","閉じる","開始重量と増加幅を指定すると、条件付きの進行例を計算します。全セット達成・フォーム安定・回復が確認できた場合だけ、次回の増量を検討。","開始重量は未設定です。達成状況に応じた自動重量更新は行いません。","集計は観察データです。同じ技法の効果、RIRの正確さ、筋活動率や疲労の原因を証明するものではありません。複数セット・異なる種目を混ぜた挙上量から優劣を判断しません。","集計期間","食べた物（標準量の概算）","食事","食事から身体づくり","食事の一部だけ記録されている可能性があるため摂取kcalの充足は判定しません。","食事の記録状況を含める","食事を記録","食事を記録する","食事プランへ →","食事プランを見る →","食事目標の変更履歴","食事記録","食事記録がある日","食事記録に追加","食事記録日","食事量と献立を目的別に考える。カーボアップやリフィードも学べる。"]);

// Reversible fixed-UI localization. No record, input value or generated prose is translated.
Object.assign(dictionary,{"トレーニング記録":"TRAINING RECORDS","注意：":"Caution:","4 / 8 / 12週":"4 / 8 / 12 weeks","言語切替":"Language","この端末で入力・記憶を確認する（外部送信なし）":"Review local input and memory (no external sending)","オフライン・送信無効":"Offline; sending disabled","身体測定の記録":"BODY MEASUREMENTS","言語切替は未対応":"Language switch not implemented"});
Object.assign(dictionary,{"完全バックアップをダウンロード":"Download a complete backup","保存済みCOACH会話と記憶メモを含める":"Include saved COACH conversation and memory notes","運動・食事・測定・本人選択・保存済みADAPT振り返りを含みます。写真・API認証情報は含みません。":"Training, nutrition, measurements, choices and saved ADAPT reflections are included. Photos and API credentials are excluded.","JSONバックアップをダウンロード":"Download JSON backup","バックアップJSON":"Backup JSON","バックアップを準備中…":"Preparing backup…","個人用データとして保管してください。COACH記憶は上で選択した場合だけ含みます。":"Keep this private. COACH memory is included only when selected above.","準備完了：保存済みCOACH記憶を含みます。":"Ready: saved COACH memory included.","準備完了：COACH会話・記憶メモは除外し、削除保護情報を含みます。":"Ready: COACH conversation and memory notes excluded; deletion protection included.","バックアップを復元":"Restore a backup","JSONを選択・ドロップ・貼付できます。旧形式も対応。検証と本人確認後にのみ記録を変更します。復元時は保存済みCOACH記憶を再読込し、このタブの未保存対話を破棄します。":"Choose a JSON file, drop it here, or paste it below. Old backups remain supported. Records change only after validation and your confirmation. Restoring reloads saved COACH memory and discards this tab’s unsaved dialogue.","復元するバックアップJSON":"Backup JSON to restore","バックアップを検証":"Validate backup","バックアップは未検証です。":"No backup validated.","身体記録をこのバックアップで置換し、チェックしたCOACH／ADAPTの差分だけ反映する":"Replace body records with this backup and apply only the checked COACH / ADAPT differences","同梱されたCOACH会話・記憶メモも復元する":"Also restore included COACH conversation and memory notes","検証済みバックアップを復元":"Restore validated backup","現在とバックアップの差分":"Current and backup differences","差分を選択":"Select differences","現在":"Current","バックアップ":"Backup","COACH／ADAPTの差分はありません。既存の記憶と振り返りを保持します。":"No COACH / ADAPT differences. Existing memory and reflections will be kept.","割り込まれた復元の前に保存した状態へ戻す":"Recover the local state saved before the interrupted restore","以前のローカル状態を復旧":"Recover previous local state","2.3MB未満のJSONを選択してください。":"Select a JSON file under 2.3 MB.","ファイル読込完了。復元前に検証してください。":"File loaded. Validate it before restoring.","ファイルを読めませんでした。再選択またはJSON貼付を行ってください。記録は変更していません。":"File could not be read. Select it again or paste JSON; records were not changed.","現在の内容を検証し、置換に同意してください。":"Validate the current contents and confirm replacement.","復元を停止しました。":"Restore stopped.","バックアップを作れませんでした。保存記録は変更していません。保留中の復旧やブラウザーの保存状態を確認してください。":"Backup could not be prepared. Saved records have not changed. Check pending recovery or browser storage."});
Object.assign(dictionary,{"+ 運動を記録":"+ Log a workout","5×5：各セットの保存記録で判定":"5×5: assess saved individual sets","5セット個別の記録がありません。TRAININGの「記録・履歴」→「セット詳細を入力」で各セットを記録してください。":"Five individual sets are missing. Enter each set through TRAINING history and set details.","90分以上の長時間持久系競技に対する成人の一般的参考範囲（10〜12 g/kg/日）。高い摂取量が必ず適切とは限らず、胃腸の耐性や運動量・体調を確認して専門家と調整。入力した食事プランへは反映しません。":"An adult reference range for endurance events lasting at least 90 minutes is 10–12 g/kg/day. Individual suitability, gastrointestinal tolerance, workload and health need professional review. This does not change the food plan.","90分未満の競技では典型的な高糖質ローディングを前提にしません。通常の食事と試合前後の補給を優先。":"Typical high-carbohydrate loading is not assumed for events under 90 minutes. Prioritize familiar meals and event-related fuelling.","ADAPT承認済みの次回予定":"ADAPT-approved next session","BIG3 ANALYZER：連携構想":"BIG3 ANALYZER: planned integration","BODY・HealthKit・リング・コーチとの実通信は未接続。記録の保存状態はこの端末のブラウザーに依存します。":"BODY, HealthKit, rings and human-coach transport are not connected. Record retention depends on this browser.","BODY：連携構想":"BODY: planned integration","COACH：未接続":"Human coach: not connected","RIR 2は「あと約2回できる感覚」。負荷調整には実際のフォーム、疲労、痛み、目標を合わせて確認する。":"RIR 2 means feeling able to perform about two more repetitions. Review technique, fatigue, pain and goals before adjusting load.","S.u.G EVOLINK｜正式ロゴ・6画面統合検証候補":"S.u.G EVOLINK | Official logo and six-screen integration candidate","SETS 記録済":"SETS recorded","TRAININGで今回計算した候補（未保存）":"Candidate calculated in TRAINING this session; not saved","これは教育目的の献立構成例であり食品量の確定処方ではありません。未成年や持病・服薬・体重階級に関する調整は適切な専門家と行ってください。":"Educational meal examples, not prescribed food quantities. Minors and people with medical, medication or weight-class concerns should seek individual professional guidance.","カーボローディング＝長時間競技のエネルギー準備。カーボアップ＝コンテストなどでの身体の見え方の調整。どちらも一律処方はしません。脱水・利尿・塩分制限による急速減量の自動プランはありません。":"Carbohydrate loading prepares energy for long endurance events; contest carb-up addresses appearance. Neither is a universal prescription. No automatic dehydration, diuretic or salt-restriction weight-loss plan is provided.","コンテストのカーボアップは持久系の「10〜12 g/kg」を転用しません。まず練習時の試行データ、本人の体重・写真・胃腸状態を確認します。自動の水分・塩分操作はありません。":"Do not transfer the endurance reference of 10–12 g/kg to physique carb-up. Review previous trials, weight, photos and gastrointestinal response. Water and salt changes are never automated.","セットRIR平均":"Mean set RIR","セットごとの重量・REP・RIRまたは違和感が一括記録と異なります。詳細ログで確認してください。":"Individual load, reps, RIR or discomfort differ from the summary. Review the detailed log.","セット単位のテンポは自己申告。速度・関節角度の測定ではありません。入力内容はコーチへ自動送信されません。":"Set tempo is self-reported, not measured velocity or joint angles. Entries are not automatically sent to a coach.","セット数が異なるため、セット番号ごとの直接比較は表示しません。":"Set counts differ; matching set numbers are not compared directly.","セット詳細がある記録はセットごとの重量×REPを集計し、なければ一括入力の重量×REP×SETを使用。全種目表示では異なる種目が混在するため、トレーニング成果の直接比較はできません。":"Volume sums load × reps for detailed sets, or load × reps × sets for summaries. Mixed-exercise totals do not directly compare training outcomes.","セット詳細を削除":"Delete set details","チャートには2件以上の記録が必要です。":"At least two records are required for the chart.","データ削除（要確認）":"Delete data; confirmation required","バックアップを読み込む":"Restore a backup","ボディコンテストへの持久系ローディング数値の転用は禁止。水抜き・利尿・急速減量は自動提案しません。":"Do not apply endurance-loading quantities to physique contests. No automatic water cutting, diuretic or rapid weight-loss advice is provided.","今回の実挙上量":"Current recorded volume","今日の余力を確認する":"Review today's remaining capacity","仮の増量幅":"Illustrative load increment","保存された5セット":"Five saved sets","保存状態を確認":"Check storage","再評価へ →":"Review in ADAPT →","再評価を見る →":"Open review →","前回の実挙上量":"Previous recorded volume","参考情報：1〜2.5時間程度の持久性・断続的競技では、運動中の糖質補給が30〜60 g/時とされる場面があります。連続運動時間・休憩・競技規則・胃腸の耐性に合わせて検討します。":"Some endurance or intermittent activities lasting about 1–2.5 hours use carbohydrate fuelling references of 30–60 g/hour. Consider continuous exercise time, breaks, rules and gastrointestinal tolerance.","参考糖質量／日":"Reference carbohydrate per day","各セットを確認して保存":"Confirm and save each set","同じ種目の記録が2件以上あれば、前回と今回の条件を比較できます。":"Two records of the same exercise allow a comparison of previous and current conditions.","同一種目・REP・SETの異なる日付の記録が2件以上なく、重量比較は保留。":"Hold the load comparison until two different dates have matching exercise, reps and sets.","回":"reps","回復記録なし（BODY自動連携なし）":"No recovery records; BODY sync is unavailable","回数またはセット数が違います。総挙上量のみで成果を断定しません。":"Rep or set counts differ. Total volume alone does not establish improvement.","基本種目 × 5セット × 5回":"Main lift × five sets × five reps","外部への送信・同期はありません。":"No external sending or synchronization.","大会形式と体重・競技時間を入力して保存すると、競技別の参考情報を表示します。食事目標は自動更新しません。":"Save event type, weight and duration to show event-specific reference information. Food targets do not update automatically.","大会情報を保存・参考計画を表示":"Save event details and show reference plan","実施ログ":"Workout logs","実施技法（任意）":"Technique used; optional","実施記録はありません。入力した実データだけを保存します。":"No workout records. Only entered actual data is saved.","実記録挙上量":"Recorded lifting volume","対象種目の重量記録なし":"No weight record for the selected exercise","平均RIR":"Mean RIR","承認済み次回予定を削除":"Delete the approved next-session plan","持久系の糖質ローディングはHPRC（2026年）、競技中の補給はAIS、競技美のピーク調整は2024年レビューと2026年のトレーニングレビューを参照。競技美の糖質操作は効果を断定できるほどの実験的証拠がなく、少数の変数を事前に試す方針。":"Existing source references: HPRC (2026) for endurance loading, AIS for in-event fuelling, and 2024/2026 reviews for physique preparation. Evidence does not establish physique carbohydrate manipulation as reliably effective; trial only a few variables beforehand.","挙上量の変化":"Recorded volume over time","新しく作成するまで保存した計画は変更されません。":"The saved plan stays unchanged until you explicitly create a new one.","方法A・B｜メリットとデメリット":"Methods A and B: benefits and limitations","方法を選択してください。":"Select a method.","日時と競技時間は本人が入力。結果を表示しても、通常のPFC目標・献立・食事記録は勝手に変更されません。":"You enter the date and duration. Showing results never changes normal PFC targets, menus or food logs.","最大入力重量":"Maximum entered load","最新RIR":"Latest RIR","未入力の旧ログには数値を推定しません。空欄には各セットの実際の値を入力してください。元の一括サマリーは変更せず、詳細値は別に保管します。実際に確認した値だけ保存してください。":"Do not infer values for older logs without details. Enter the actual values for every set. Original summaries remain unchanged; confirmed details are stored separately.","未来の身体が変わる。":"Shape your future body.","本人が入力したRIRから、再評価画面に参考コメントを表示できます。":"Self-reported RIR can provide reference comments in ADAPT.","本日入力した食品の概算です。未入力分は推定しません。":"Approximate values from today's entered foods only; missing intake is not estimated.","検討案を取り下げ":"Withdraw the proposal","次の一手":"Your next step","次回の負荷変更は保留し、フォーム・体調・休養を確認する材料にしてください。自動で重量を変更しません。":"Hold the next load change and review technique, condition and rest. Load is never changed automatically.","比較したい種目を上のチップから選んでください。種目が混ざった状態では直接比較しません。":"Choose an exercise using the chips above. Mixed exercises are not directly compared.","比較は教育用です。選択・比較しても週間計画や学習履歴を自動変更しません。":"Educational comparison only. Selection and comparison never modify weekly plans or learning history automatically.","比較保留：":"Comparison on hold:","現在の記録では新しい判断は保留です。既存の承認済み予定も実施前に再確認してください。":"Current records do not support a new decision. Review any previously approved plan before use.","生成した共有文面（編集・選択可）":"Generated sharing draft; editable","痛み・違和感、またはフォーム未確認の申告が含まれています。負荷増量の判断を行いません。":"Pain, discomfort or unconfirmed technique is recorded. No load increase decision is made.","痛み・違和感あり":"Pain or discomfort recorded","目安の期間":"Reference duration","目標に応じてトレーニングと食事を設計します。":"Training and food planning follow your selected goal.","確認してNUTRITION目標へ反映":"Confirm and apply to NUTRITION target","競技・コンテスト種別":"Event or contest type","総挙上量":"Total lifting volume","自分の進化を記録。":"Record your own progress.","表示中の文面をコピー（送信なし）":"Copy the displayed draft; no sending","計画をコピー":"Copy the plan","計算候補であり自動処方・実測センサー値ではありません。本人または指導者が確認するまで既存計画・記録を変更しません。":"Candidates are not automatic prescriptions or sensor measurements. Records and plans stay unchanged until you or your coach confirm them.","計算結果は提案候補。BMI・性別による一律の重量補正はせず、未確認データから増量を自動確定しません。":"Results are candidates. No universal BMI- or sex-based load multiplier is used; unverified inputs never authorize an increase.","記録なし。セット実績を推定しません。":"No records. Set performance is not inferred.","記録・履歴でセット詳細を入力":"Enter set details through records and history","記録・目標・日付の変化があり、保存時の根拠が古くなっています。新たに検討案を作り直してください。":"Records, goals or dates have changed since this proposal was saved. Create a new review using current evidence.","設定・データ管理を閉じる":"Close settings and data","通常の食事計画に戻る":"Return to the normal food plan","週内で刺激を変える":"Vary the stimulus within the week","週間プランやTMの計算は変更されていません。実施時に実際の内容を記録してください。":"Weekly plans and TM calculations remain unchanged. Log actual performance when you train.","週間配置例は下の「週間プラン作成」で表示できます。種目別の自動負荷設定は行いません。":"Weekly examples are shown in the planner below. No automatic exercise-specific load prescription is made.","進化する。":"Keep progressing.","進行例を表示":"Show an illustrative progression","運動・栄養・見た目・指導をひとつに。自分の記録から、次の行動を考える。":"Bring training, nutrition, appearance and guidance together. Use your own records to choose the next action.","違和感":"Discomfort","選択した負荷調整方式の意味":"Meaning of the selected load-adjustment method","開始重量と増加幅を指定すると、条件付きの進行例を計算します。全セット達成・フォーム安定・回復が確認できた場合だけ、次回の増量を検討。":"Enter the starting load and increment for a conditional example. Consider an increase only after complete sets, stable technique and recovery are confirmed.","開始重量は未設定です。達成状況に応じた自動重量更新は行いません。":"Starting load is not set. Loads are not updated automatically from completion.","食事から身体づくり":"Support training through food","食事プランへ →":"Go to the food plan →","食事プランを見る →":"View the food plan →","食事量と献立を目的別に考える。カーボアップやリフィードも学べる。":"Plan food and menus around your goal. Explore carb-up and refeed concepts."});
Object.assign(dictionary,{"通常の食事":"Regular meals","目的・運動量・体調に合わせた継続できる食事を中心にする。":"Focus on sustainable meals suited to your goal, activity and condition.","カーボアップ（コンテスト）":"Contest carb-up","筋肉の張りなど見た目を整える目的で糖質量を検討する。持久系カーボローディングとは目的も根拠も別。大会前に個人の反応を試しておく。":"Consider carbohydrate intake for contest appearance, including muscle fullness. Its purpose and evidence differ from endurance loading. Trial individual responses before the event.","カーボローディング（長時間競技）":"Carbohydrate loading for long events","長時間競技の前にグリコーゲンを蓄える考え方。90分以上の長時間運動では、直前36〜48時間の高糖質摂取が検討される。":"An approach to storing glycogen before a long event. For exercise lasting at least 90 minutes, higher carbohydrate intake during the preceding 36–48 hours may be considered.","ディプリート":"Carbohydrate depletion","糖質を意図的に減らす方法。大会前の必須工程ではなく、十分な効果根拠もないため自動処方はしない。":"Deliberately reduce carbohydrate intake. This is not a required pre-event step and is not automatically prescribed because sufficient evidence of benefit is lacking.","リフィード":"Refeed","減量中に計画的に摂取量を戻すことを検討。必ずしも代謝の回復を保証しない。":"Consider a planned increase in intake during a fat-loss phase. This does not guarantee metabolic recovery.","ダイエットブレイク":"Diet break","減量期の途中で維持エネルギー付近の期間を設け、継続性や回復を確認する。":"Include a period near maintenance intake during a fat-loss phase and review adherence and recovery.","試合中の補給":"In-event fuelling","競技の時間や暑さ・発汗・胃腸の耐性を基に、運動中の糖質補給や水分を計画する。":"Plan carbohydrate and fluids during exercise around event duration, heat, sweating and gastrointestinal tolerance.","試合前の食事":"Pre-event meal","開始時刻から逆算し、普段食べ慣れた食事・消化のしやすさ・胃腸の反応を確認する。":"Plan backwards from the start time. Review familiar foods, digestibility and gastrointestinal response.","ピークウィーク（競技美）":"Physique peak week","大会直前の練習量・回復・炭水化物・ポージングを記録。脱水・塩分操作などの危険な処方は生成しない。":"Record pre-event training volume, recovery, carbohydrate intake and posing. No hazardous dehydration or salt-manipulation prescription is generated.","試合・コンテストの栄養戦略":"Event and contest nutrition strategies","大会から逆算する":"Plan backwards from the event","大会日":"Event date","体重（kg）":"Body weight (kg)","競技時間（時間）":"Event duration (hours)","軽減率 %":"Reduction %","参考重量（kg・任意）":"Reference load (kg; optional)","量・負荷・難度を状況に応じて減らし、技術練習を維持。 累積疲労を整理し、次の練習に向けた余裕を作れる。":"Reduce volume, load and difficulty as appropriate while maintaining technique practice. Manage accumulated fatigue and create capacity for the next phase.","両週それぞれ異なる日付の体重測定が2日以上必要":"At least two different weight-measurement days are needed in each week","両週とも食事記録が5日以上必要":"At least five food-record days are needed in both weeks","NUTRITIONで目標kcalの設定が必要":"Set the energy target in NUTRITION","目標を減量・増量・維持から選択":"Choose fat loss, muscle gain or maintenance","競技直前・特殊栄養戦略中は一般的なkcal変更を保留":"Hold general energy changes near an event or during a special nutrition strategy","測定履歴：Not recorded":"Measurement history: Not recorded","1RM・Training Max":"1RM and Training Max","1RM・Training Max。方式と計測条件が合わない式は使いません。":"1RM and Training Max. Do not use formulas that do not match the method and measurement conditions.","5セット×5回の実施確認":"Confirmed five sets of five","5セット×5回の実施確認。方式と計測条件が合わない式は使いません。":"Confirmed five sets of five. Do not use formulas that do not match the method and measurement conditions.","1RMと当日の強度%":"1RM and today’s intensity percentage","1RMと当日の強度%。方式と計測条件が合わない式は使いません。":"1RM and today’s intensity percentage. Do not use formulas that do not match the method and measurement conditions.","実測RIRと目標RIR":"Recorded and target RIR","実測RIRと目標RIR。方式と計測条件が合わない式は使いません。":"Recorded and target RIR. Do not use formulas that do not match the method and measurement conditions.","週別の負荷・セット推移":"Weekly loads and sets","週別の負荷・セット推移。方式と計測条件が合わない式は使いません。":"Weekly loads and sets. Do not use formulas that do not match the method and measurement conditions.","期ごとの実施量":"Workload by phase","期ごとの実施量。方式と計測条件が合わない式は使いません。":"Workload by phase. Do not use formulas that do not match the method and measurement conditions.","回数達成・重量":"Rep completion and load","回数達成・重量。方式と計測条件が合わない式は使いません。":"Rep completion and load. Do not use formulas that do not match the method and measurement conditions.","練習量の変化":"Change in training volume","練習量の変化。方式と計測条件が合わない式は使いません。":"Change in training volume. Do not use formulas that do not match the method and measurement conditions.","軽減率（任意設定）":"Reduction percentage; optional","軽減率（任意設定）。方式と計測条件が合わない式は使いません。":"Reduction percentage; optional. Do not use formulas that do not match the method and measurement conditions.","主セット／追加セットの実施量":"Main and back-off set workload","主セット／追加セットの実施量。方式と計測条件が合わない式は使いません。":"Main and back-off set workload. Do not use formulas that do not match the method and measurement conditions.","各セットの重量・回数":"Load and reps for each set","各セットの重量・回数。方式と計測条件が合わない式は使いません。":"Load and reps for each set. Do not use formulas that do not match the method and measurement conditions.","高重量セットと後続セット":"Heavy set and subsequent sets","高重量セットと後続セット。方式と計測条件が合わない式は使いません。":"Heavy set and subsequent sets. Do not use formulas that do not match the method and measurement conditions.","総反復・セット内休息":"Total reps and intra-set rest","総反復・セット内休息。方式と計測条件が合わない式は使いません。":"Total reps and intra-set rest. Do not use formulas that do not match the method and measurement conditions.","段階別重量・反復":"Load and reps by stage","段階別重量・反復。方式と計測条件が合わない式は使いません。":"Load and reps by stage. Do not use formulas that do not match the method and measurement conditions.","反復・短休息":"Repetitions and short rests","反復・短休息。方式と計測条件が合わない式は使いません。":"Repetitions and short rests. Do not use formulas that do not match the method and measurement conditions.","種目別セット・組合せ":"Sets and exercise pairings","種目別セット・組合せ。方式と計測条件が合わない式は使いません。":"Sets and exercise pairings. Do not use formulas that do not match the method and measurement conditions.","下降局面の秒数":"Seconds in the lowering phase","下降局面の秒数。方式と計測条件が合わない式は使いません。":"Seconds in the lowering phase. Do not use formulas that do not match the method and measurement conditions.","保持秒数":"Hold duration in seconds","保持秒数。方式と計測条件が合わない式は使いません。":"Hold duration in seconds. Do not use formulas that do not match the method and measurement conditions.","下降・停止・上昇時間":"Lowering, pause and raising times","下降・停止・上昇時間。方式と計測条件が合わない式は使いません。":"Lowering, pause and raising times. Do not use formulas that do not match the method and measurement conditions.","左右別の反復・重量":"Reps and loads by side","左右別の反復・重量。方式と計測条件が合わない式は使いません。":"Reps and loads by side. Do not use formulas that do not match the method and measurement conditions.","接地時間・ジャンプなど実測時のみ":"Ground-contact time and jumps; measured data only","接地時間・ジャンプなど実測時のみ。方式と計測条件が合わない式は使いません。":"Ground-contact time and jumps; measured data only. Do not use formulas that do not match the method and measurement conditions.","挙上速度（センサー実測が必要）":"Bar velocity; a sensor measurement is required","挙上速度（センサー実測が必要）。方式と計測条件が合わない式は使いません。":"Bar velocity; a sensor measurement is required. Do not use formulas that do not match the method and measurement conditions.","高重量種目と瞬発種目の対":"Pair a heavy exercise with an explosive exercise","高重量種目と瞬発種目の対。方式と計測条件が合わない式は使いません。":"Pair a heavy exercise with an explosive exercise. Do not use formulas that do not match the method and measurement conditions.","出力・速度（実測時のみ）":"Power and velocity; measured data only","出力・速度（実測時のみ）。方式と計測条件が合わない式は使いません。":"Power and velocity; measured data only. Do not use formulas that do not match the method and measurement conditions.","距離・時間・平均速度":"Distance, duration and average speed","距離・時間・平均速度。方式と計測条件が合わない式は使いません。":"Distance, duration and average speed. Do not use formulas that do not match the method and measurement conditions.","実施距離・所要時間":"Performed distance and elapsed time","実施距離・所要時間。方式と計測条件が合わない式は使いません。":"Performed distance and elapsed time. Do not use formulas that do not match the method and measurement conditions.","反復ごとの時間・合計":"Time per repetition and total","反復ごとの時間・合計。方式と計測条件が合わない式は使いません。":"Time per repetition and total. Do not use formulas that do not match the method and measurement conditions.","時間・距離・心拍（記録がある場合）":"Duration, distance and heart rate; recorded data only","時間・距離・心拍（記録がある場合）。方式と計測条件が合わない式は使いません。":"Duration, distance and heart rate; recorded data only. Do not use formulas that do not match the method and measurement conditions.","平均ペース・運動時間":"Average pace and exercise duration","平均ペース・運動時間。方式と計測条件が合わない式は使いません。":"Average pace and exercise duration. Do not use formulas that do not match the method and measurement conditions.","運動時間・休息時間・反復数":"Work duration, rest duration and repetitions","運動時間・休息時間・反復数。方式と計測条件が合わない式は使いません。":"Work duration, rest duration and repetitions. Do not use formulas that do not match the method and measurement conditions."});
Object.assign(dictionary,{"元の保存データを保護中です。再保存していません。":"Original saved data is protected. Nothing was saved again.","ブラウザへの保存に失敗しました。未保存の変更は取り消しました。":"Browser storage failed. Unsaved changes were rolled back.","目標を保存しました":"Goal saved.","バックアップのダウンロードを開始しました":"Backup download started.","献立例を切り替えました。食事記録には追加していません。":"Sample menu changed. Nothing was added to actual food records.","この日の回復記録を削除しますか？":"Delete this day's recovery record?","回復記録を削除しました。次回の負荷判断を再確認してください。":"Recovery record deleted. Review the next load decision.","この運動記録を削除しますか？":"Delete this workout record?","運動記録を削除しました":"Workout record deleted.","このコーチメモを削除しますか？":"Delete this coach note?","メモを削除しました":"Note deleted.","この身体測定を削除しますか？":"Delete this body measurement?","測定記録を削除しました":"Measurement deleted.","この食事記録を削除しますか？":"Delete this food entry?","食事記録を削除しました":"Food entry deleted.","この運動ログのセット詳細のみ削除しますか？ 一括記録は残ります。":"Delete only this workout's set details? The summary will remain.","詳細のみ削除しました":"Set details deleted; summary retained.","共有前のレビュー文面を表示しました。送信していません。":"Sharing draft shown for review. Nothing was sent.","文面を先に生成してください":"Generate the draft first.","共有文面をコピーしました。送信していません。":"Sharing draft copied. Nothing was sent.","この環境ではコピーできません。文面欄から選択してください。":"Copy is unavailable here. Select the text in the draft field.","推定1RMを1〜600kgで入力してください":"Enter an estimated 1RM between 1 and 600 kg.","開始重量と増量幅を確認してください":"Check the starting load and increment.","週間プランがありません":"No weekly plan is saved.","週間プランをコピーしました。送信はしていません。":"Weekly plan copied. Nothing was sent.","コピーが使えない環境です。画面の内容を利用してください。":"Copy is unavailable. Use the displayed plan.","比較写真を破棄しました":"Comparison photos discarded.","要約をコピーしました。送信はしていません。":"Summary copied. Nothing was sent.","この環境ではコピーできません。HTTPSまたはlocalhostでお試しください。":"Copy is unavailable here. Try HTTPS or localhost.","比較条件が揃っていません。反映しません。":"Comparison conditions are incomplete. Nothing was applied.","承認済みの次回予定を新しい候補で上書きしますか？":"Replace the approved next-session plan with this candidate?","明示的な承認により次回予定を登録しました。":"Next-session plan registered by your explicit approval.","承認済みの次回予定を削除しますか？ 運動ログと週間プランは保持します。":"Delete the approved next-session plan? Workout logs and weekly plans will remain.","承認済み次回予定を削除しました。":"Approved next-session plan deleted.","現在の記録で再評価し、新しい検討案を保存してください":"Review the current records and save a new proposal.","目標kcalの範囲外です。反映できません":"Energy target is outside the permitted range. Nothing was applied.","確認された目標kcalだけを反映しました。":"Only the confirmed energy target was applied.","未適用の検討案を取り下げますか？ 既存の食事・運動記録は保持します。":"Withdraw the unapplied proposal? Training and food records will remain.","検討案を取り下げました":"Proposal withdrawn.","変更理由を5文字以上入力してください":"Enter at least five characters explaining the change.","再評価メモを保存しました":"Review note saved.","EVOLINKのローカル記録をすべて消去しますか？写真はすでに保存されていません。":"Delete all local EVOLINK records? Photos are not stored.","ローカル記録を消去しました":"Local records cleared.","確認済みのセット詳細を更新しますか？":"Update the confirmed set details?","セット別実績を保存しました。一括記録は変更していません。":"Individual sets saved. The original summary is unchanged.","内容・理由・記録の確認チェックを入力してください":"Complete the action, reason and record-confirmation checkbox.","変更幅は50〜300kcal、50kcal刻みで指定してください":"Use an energy change of 50–300 kcal in increments of 50.","NUTRITION目標と身体づくりの目的を設定してください":"Set the NUTRITION target and body goal.","変更可能な記録条件が揃っていません。検討メモとして維持・見直しを選べます":"Evidence does not support a change. Save a maintain or review proposal instead.","前の検討案を履歴に移して、新しい検討案を保存しますか？":"Move the previous proposal to history and save a new one?","検討案を保存しました。数値は未反映です。":"Proposal saved. Settings have not changed.","重量・回数・セット・RIRの入力を確認してください":"Check load, reps, sets and RIR.","登録されていない方式は保存できません":"An unregistered method cannot be saved.","種目を確認してください":"Check the exercise.","併用技法は主方式と重複させず、最大3種類で指定してください":"Select at most three additional techniques, without duplicating the main method.","実施日を正しく入力してください":"Enter a valid workout date.","トレーニングをローカル保存しました":"Workout saved locally.","回復記録の値を確認してください":"Check the recovery values.","日付付き回復記録を保存しました。負荷は変更していません。":"Dated recovery record saved. Load is unchanged.","参考重量は1〜600kgで入力してください":"Enter a reference load between 1 and 600 kg.","主種目・週回数・週番号を確認してください":"Check the main lift, weekly frequency and week number.","設定値を確認してください。5/3/1・5×5には主種目の重量が必要です。":"Check the settings. 5/3/1 and 5×5 require a main-lift load.","週間プランを端末内に保存しました。実行記録は変更していません。":"Weekly plan saved locally. Actual workout records are unchanged.","体重と目標カロリーを入力してください":"Enter body weight and the energy target.","PFC配分を確認してください":"Check the PFC allocation.","設定値からPFCを計算しました":"PFC calculated from your settings.","競技種別・日付・体重・競技時間を確認してください":"Check event type, date, weight and duration.","大会情報をローカル保存しました。食事計画は自動変更していません。":"Event details saved locally. The food plan is unchanged.","食事の日付を確認してください":"Check the food-record date.","食品と食数を確認してください":"Check the food and quantity.","食事をローカル保存しました":"Food entry saved locally.","測定日を確認してください":"Check the measurement date.","体重または腹囲を正しく入力してください":"Enter a valid weight or waist measurement.","身体測定値を記録しました":"Body measurement saved.","メモの内容を確認してください":"Check the note.","メモを保存しました（送信なし）":"Note saved; nothing sent.","2MB以内のJSONファイルを指定してください":"Select a JSON file no larger than 2 MB.","バックアップ形式・入力値が不正です":"Backup format or values are invalid.","現在のローカル記録を、選択したバックアップの内容で置き換えますか？":"Replace the current local records with this backup?","バックアップを読み込みました":"Backup restored.","JSONを読み込めませんでした":"Could not read the JSON.","推定1RMは1〜10回に限定":"Estimated 1RM is limited to 1–10 repetitions.","強度が0":"Intensity cannot be zero.","TM比率は70〜95%":"TM percentage must be 70–95%.","セット配列が必要":"A set array is required.","目的が不正":"Invalid goal.","経験が不正":"Invalid experience.","回復状態が不正":"Invalid recovery state.","増量率は0超〜10%以下":"Increase percentage must be greater than zero and no more than 10%.","RIRは0〜10":"RIR must be 0–10.","デロード率不正":"Invalid deload percentage.","未対応の方式":"Unsupported method.","対応する保存形式ではありません":"Unsupported saved-data format.","痛み・違和感の有無を確認してください":"Confirm whether pain or discomfort is present.","登録されていない方式":"Unregistered method.","1RMが入力範囲外":"1RM is outside the input range.","割合は50〜100%":"Percentage must be 50–100%.","軽減率は0〜100%未満":"Reduction must be at least zero and less than 100%.","時間は24時間以内":"Duration must not exceed 24 hours.","距離が入力範囲外":"Distance is outside the input range.","反復数が不正":"Invalid repetition count.","増量率は10%以下":"Increase percentage must not exceed 10%.","保全済み負荷計算コアが見つからない":"The preserved load-calculation core is unavailable."});
Object.assign(dictionary,{"相談・問いかけ":"Talk & reflect","本人同意・参照範囲":"Consent & record scope","本人選択・保存・修正":"Choice, save & edit","保存済み振り返り・次の行動":"Saved reflections & next action","記録・学習":"Record & Learn","対話履歴":"Conversation history","保存した会話の確認・修正":"Review & correct saved dialogue","気づきメモ":"Insight notes","本人が残す記憶":"Notes you choose to keep","学習カルテ":"Learning record","記憶・振り返りの整理":"Review memory & reflections","保存は本人の選択。学習カルテは保存済み記憶と振り返りを確認する入口です。自動の性格判定・成長スコアではありません。":"You choose what to save. Learning record opens saved memory and reflections; it does not create personality ratings or growth scores.","同意・履歴・指導者下書き・データ管理":"Consent, history, instructor draft & data","身体記録4分野・写真送信なし":"Four record categories; no photos sent","指導者向け下書き":"Instructor draft","既存のメモ・共有下書き":"Existing notes & sharing draft","JSONバックアップ":"JSON backup","記憶は本人が含める項目を選択":"You choose which memory to include","JSON復元":"Restore JSON","復元前の差分・同意を確認":"Review differences & consent first","音姫 COACH":"Otohime COACH","今日はどんなことを話す？":"What would you like to talk about?","トレーニング・食事・体調・気づき・考えたいことなど、自由に入力できます。":"Write freely about training, meals, how you feel, or something you want to reflect on.","入力ガイドです。AI応答・保存済み会話ではありません。":"Input guide only; not an AI response or saved conversation.","同意・体調・本人選択（送信前に確認）":"Consent, health & my choice (check before sending)","ここに入力…（記録は原文のまま保存）":"Write here… (saved text stays in your original words)","目標・計画":"Goals & plans","栄養・食事":"Nutrition & meals","回復・体調":"Recovery & health","考え方・習慣":"Thinking & habits","入力内容を確認・修正してから送信できます。自動送信はしません。":"Review and edit your words before sending. Nothing is sent automatically.","対話で気づき、学び、行動につなげる":"Reflect, learn and choose your next action.","保存済み振り返りを修正・削除":"Edit or delete saved reflections","Conversation topics":"Conversation topics"});
Object.assign(dictionary,{"本人選択・振り返り":"My choice & reflection"});
Object.assign(dictionary,{"送信停止：明示的な同意と参照範囲の確認が必要です。":"Sending stopped: explicit consent and context review are required.","実AI送信は無効です。APIクレジット使用の別途承認が必要です。":"Real AI sending is disabled. Separate server approval for API credit use is required.","送信承認の期限が切れました。送信していません。":"The server approval has expired. Nothing was sent.","承認された通信回数に達しました。自動再試行・購入はしません。":"The approved request allowance is exhausted. No automatic retry or purchase.","通信回数の管理記録を確認できないため、送信を停止しました。":"The local request allowance could not be checked. Sending is stopped.","実AI送信を停止しました。保存済み記録は変更していません。":"Real AI sending has been stopped. Saved records are unchanged.","別の応答処理中です。追加送信はしていません。":"Another response is in progress. No second request was sent.","サーバー側の認証情報を読み込めません。送信していません。":"The server credential could not be loaded. Nothing was sent.","ローカル模擬Responses準備完了・実API通信なし":"Local Responses fixture ready; no real API communication","ローカル模擬応答を処理中・実API通信なし":"Local fixture is responding; no real API communication","ローカル模擬通信は停止中・実API通信なし":"Local fixture stopped; no real API communication","本人の確認後、実AIへ送信中…":"Sending to real AI after your confirmation…","実AI送信は無効です。":"Real AI sending is disabled.","直前の実AI通信は成功。次の明示的な送信操作を待っています。":"Last real AI request succeeded; waiting for your next explicit send.","実AI経路は準備済み・現在は未接続。同意と参照範囲を確認してから送信できます。":"Real AI route ready; not currently connected. Send only after consent and context review.","実AI経路：本人同意と参照範囲の確認後だけ送信します。送信時にAPIクレジットを使用します。":"Real AI route: send only after your consent and context review. API credits are used only when you send.","この入力と確認した文脈をOpenAIへ送ることに同意します（APIクレジットを使用）":"I agree to send this message and the reviewed context to OpenAI (uses API credits)","実AI COACHへ送信":"Send to real COACH","実AI送信を停止":"Stop real AI sending"});
Object.assign(dictionary,{"ローカルの実AI経路fixtureです。実API通信・本物の生成応答はありません。":"Local live-route fixture only. No real API calls or real generative response.","ローカルの送信経路fixtureに同意します（実APIクレジット消費なし）":"I agree to this local live-route fixture (no real API credit use)"});
Object.assign(dictionary,{"接続チェック（実API通信なし）":"Connection checks (no real API request)","接続条件を確認（通信なし）":"Check local connection conditions","ローカル接続条件を確認しました。実API通信・DPAPI読込は行っていません。":"Local conditions checked. No real API communication or DPAPI read.","ローカルサーバーへの接続に失敗しました。実API通信は行っていません。":"Local server connection failed. No real API request was sent."});
Object.assign(dictionary,{"現状分析":"Current analysis","入力済み記録を確認":"Review recorded data","週次レビュー":"Weekly review","本人の理由・次週の検討":"Your reasons & next week","プラン調整":"Plan adjustment","候補・本人承認":"Candidates & approval","適用履歴":"Application history","食事変更・承認済み予定":"Food changes & approved plan","現在のコンディション":"Current condition","保存記録を読込済み。記録がない項目だけ未記録と表示します。":"Saved records loaded. Only categories without entries are marked not recorded.","読込失敗。保存データを保護し、記録の有無・評価は表示しません。":"Read failed. Saved data is protected; record availability and assessments are not shown.","読込状態未確認。記録の有無・評価は表示しません。":"Read status unverified. Record availability and assessments are not shown.","未評価":"Not evaluated","読込失敗":"Read failed","読込状態未確認":"Read status unverified","読込未確認":"Read unverified","回復・睡眠":"Recovery & sleep","体調・疲労":"Health & fatigue","保存済みの記録と日付のみ。評価点・回復率・改善率は生成しません。体調・疲労は回復記録の自己申告です。":"Saved records and dates only. No assessment, recovery or improvement score is generated. Health and fatigue are self-reported recovery entries.","未記録はゼロ摂取・休養・良好とは扱いません。比較条件とデータ不足を確認してください。":"Missing records do not mean zero intake, rest or good health. Review comparison conditions and missing data.","保存済みの検討案あり。適用状態と記録条件は詳細で確認してください。":"A saved proposal exists. Open details to review its application status and evidence.","週次レビューは未保存・未評価です。入力・保存は詳細から行えます。":"Weekly review is not saved or evaluated. Open details to enter and save it.","ADAPTプラン・本人承認":"ADAPT plan & personal approval","痛み・不調・条件不足は保留。重量・食事・目標を自動変更しません。":"Pain, poor health or insufficient evidence puts changes on hold. Loads, meals and goals never change automatically.","記録と振り返り":"Records & reflection","入力・履歴":"Entry & history","記録の推移":"Recorded trends","本人選択・振り返り":"My choice & reflection","保存済みCOACH・本人メモ":"Saved COACH & personal notes","本人の明示操作で保存・適用します。保存原文は言語切替で変更しません。":"Save and apply only by your explicit action. Language switching preserves original saved text.","4 / 8 / 12週の長期推移":"4 / 8 / 12-week trends","食事目標の変更履歴を表示します。負荷調整は現在の承認済み次回予定を確認できます。過去の負荷適用一覧は保存されていません。":"Food target change history is shown. For load adjustments, review the current approved next-session plan. A historical load-application list is not stored."});
const LOCALE_KEY='sug_evolink_ui_locale_v1';let language='en';try{const saved=localStorage.getItem(LOCALE_KEY);if(['ja','en'].includes(saved))language=saved}catch{}
const inverse=new Map(Object.entries(dictionary).map(([ja,en])=>[en,ja]));const textCache=new WeakMap(),attrCache=new WeakMap();
const methodJapanese={"5/3/1":{"meaning":"トレーニングマックスを基に波状に負荷を変える枠組み。補助種目と回復量も調整。","purpose":"中長期で筋力を段階的に積み上げる","pros":"周期を決めて過剰な毎回MAX挑戦を避けやすい。","cons":"TMを過大設定すると高強度の疲労やフォーム破綻につながりやすい。","suited":"主要挙上の技術があり、週単位の計画を立てたい人","check":"セット品質、推定筋力、疲労、週ごとの総負荷を記録","caution":"トレーニングマックスの過大設定を避け、怪我や体調で負荷を調整。"},"5×5":{"meaning":"主要な複合種目を5回×5セットとして管理する方法。最初から最大重量を狙わず、軽い重量から反復の質を確認する。","purpose":"基礎筋力と挙上技能を反復で高める","pros":"同じ主要種目で練習量と達成状況を追いやすい。","cons":"5×5は全種目・全目的に適した万能プログラムではなく、疲労管理が必要。","suited":"一定のフォームと回復を維持できる人","check":"同一種目・同一条件で達成セット、動作品質、RPE、翌日の回復を比較","caution":"関節症状や技術が安定しない場合は回数・セットを減らす。"},"DUP":{"meaning":"同じ種目群でも重い日・中程度の日・速い日など目的を分ける。","purpose":"週内に筋力・筋肥大・速度などの刺激を変える","pros":"同じ週の中で異なる負荷・反復刺激を計画できる。","cons":"週内の強度配置が複雑で、競技や仕事の疲労と重なりやすい。","suited":"複数回のトレーニングと回復を確保できる人","check":"同一課題の速度、反復達成、疲労推移を週ごとに比較","caution":"高強度日を連続させず、競技練習との重複負荷を管理。"},"RPE/RIR":{"meaning":"RIR（余力回数）またはRPEを主観記録し、同じ目標でも負荷を微調整。","purpose":"その日の余力に応じ負荷を調節","pros":"日ごとのコンディション差を負荷調整に反映しやすい。","cons":"RPE/RIRの自己評価は習熟が必要で、主観と実際の反復余力はずれる。","suited":"疲労・睡眠・練習量が変動する人","check":"同負荷でのRPE、速度、REP、回復を追う","caution":"初心者のRIR自己推定は誤差が出やすい。痛みを我慢する指標にしない。"},"線形ピリオダイゼーション":{"meaning":"基礎量から高強度へ段階化し、最終段階では疲労を抜く。","purpose":"期間に応じて回数・負荷の重点を変更","pros":"大会や目標日に向けて負荷と反復数を整理しやすい。","cons":"回復が想定とずれると予定通りの強度増加が負担になる。","suited":"明確な試合時期や中期目標がある人","check":"各期の筋力・動作品質・競技成果と疲労を比較","caution":"期間の個人差が大きいため、予定どおり進めることを優先しない。"},"ブロックピリオダイゼーション":{"meaning":"筋力蓄積期→競技動作への転換期→調整期を分ける設計例。","purpose":"蓄積・転換・実現の目的を分ける","pros":"特定能力に重点を置いた期間を組み立てやすい。","cons":"ブロック間で刺激が偏ると維持したい能力が落ちる可能性がある。","suited":"競技日程に合わせて負荷を設計したい人","check":"各期の主指標が競技成果へ移ったかを追跡","caution":"1ブロックに高負荷要素を詰め込み過ぎない。"},"トップセット＋バックオフ":{"meaning":"重い主セットの後、重量を落として追加セットを行う。","purpose":"高強度の体験と追加練習量を両立する。","pros":"主セットの重量やRPE、後続セットの達成状況を比較しやすい。","cons":"トップセットで疲労しすぎるとバックオフの質が落ちる。","suited":"主種目の高強度刺激と運動量を両立したい経験者","check":"主セットのRIR・後続セットの反復品質と回復","caution":"安全性・回復・種目条件に合わせて調整する。"},"ピラミッド法":{"meaning":"セットごとに重量を増やし、反復回数を減らす構成。","purpose":"ウォームアップから高強度へ移行する練習を整理する。","pros":"負荷を段階的に上げながら動作の準備ができる。","cons":"前半の量が多いと高重量セット前に疲労する。","suited":"段階的に重い重量へ移行したい人","check":"各段階の重量・回数・RIR","caution":"安全性・回復・種目条件に合わせて調整する。"},"リバースピラミッド法":{"meaning":"十分な準備後、重いセットから開始し後続セットで重量を下げる。","purpose":"高強度セットを早い段階に配置する。","pros":"疲労が少ない状態で主セットの高重量を扱いやすい。","cons":"準備不足ではリスクが増え、主セット後は疲労しやすい。","suited":"挙上技術を習得した中上級者","check":"トップセットの達成と後続反復品質","caution":"安全性・回復・種目条件に合わせて調整する。"},"クラスターセット":{"meaning":"連続セットを短い反復群に分割し、群間に短い休息を入れる。","purpose":"短いセット内休息で反復品質を維持","pros":"短い休憩で各反復の速度や質を保つ工夫ができる。","cons":"セット時間が延び、機材やジム環境によって運用しにくい。","suited":"パワーや高品質反復を狙う人","check":"反復ごとの速度低下・動作品質・総反復を比較","caution":"単純に総量を増やす手段として使わない。"},"ドロップセット":{"meaning":"セット終了後に重量を下げて追加反復。使用頻度は限定して評価する。","purpose":"負荷を下げて連続的に反復を行う","pros":"追加反復を短時間で確保する選択肢になる。","cons":"局所疲労が増えやすく、通常セットの代替を保証するものではない。","suited":"局所的な筋肥大刺激を工夫したい経験者","check":"総反復、回復、翌日の疲労を比較","caution":"疲労が大きくなりやすく、常用・痛み下での実施は避ける。"},"レストポーズ法":{"meaning":"短い休息のあとに少数反復を追加し、品質が低下したら終了。","purpose":"短い休息を挟み反復を追加する","pros":"短い休憩で追加反復の機会を確保できる。","cons":"限界付近の反復が増え、回復に影響する可能性がある。","suited":"フォームを保てる単関節・補助運動など","check":"追加反復の品質、負荷耐性、回復","caution":"最大挙上や技術的に危険な動作では慎重に扱う。"},"スーパーセット":{"meaning":"例：引く種目と押す種目を組み合わせ、間に必要な休憩を入れる。","purpose":"限られた時間内で複数種目を組み合わせる","pros":"二種目をまとめて実施し、時間効率を改善しやすい。","cons":"疲労の強い種目を組み合わせると後半の質が落ちることがある。","suited":"補助種目の効率を高めたい人","check":"各種目の反復品質と時間、疲労を比較","caution":"技術の難しい高重量種目の直前に過度に疲労させない。"},"エキセントリック強調":{"meaning":"下ろす局面や減速局面を制御する補助運動から開始。","purpose":"筋が伸びながら負荷を制御する能力を育てる","pros":"筋が伸ばされながら力を出す局面を重点的に練習できる。","cons":"高い張力や筋肉痛が生じやすいため、過負荷を急がない。","suited":"減速・着地・筋腱負荷への段階適応","check":"同一条件で減速安定性、痛み、翌日反応","caution":"筋肉痛が強くなりやすい。高負荷の導入速度に注意。"},"アイソメトリック":{"meaning":"壁押し・保持・角度別の静的収縮を利用。","purpose":"関節を大きく動かさず力を発揮する","pros":"関節角度を限定して筋力発揮を練習できる。","cons":"実施した角度での適応が中心になり、全可動域の練習は別に必要。","suited":"特定角度での力発揮や支持を練習したい人","check":"保持時間・角度・痛み・動作への転移","caution":"息こらえや過度の血圧上昇を避ける指導が必要。"},"プライオメトリクス":{"meaning":"低い弾み→連続跳躍→方向変更へ進み、接地と反発を観察。","purpose":"伸張短縮サイクルを使う跳躍・反発の技能","pros":"素早い伸張—短縮の動作を練習できる。","cons":"着地衝撃があるため、段階づけと十分な休息・床面条件が必要。","suited":"着地制御が安定し段階的に跳躍を増やせる人","check":"接地時間、跳躍高、着地安定性、痛み","caution":"成長段階・腱症状・疲労・着地能力に応じて導入。"},"VBT（速度ベース）":{"meaning":"バーや器具の実測速度を使い、負荷や疲労を調整する。","purpose":"速度に基づいてその日の負荷設定を判断する。","pros":"速度低下を定量化し、主観だけに頼らない判断材料となる。","cons":"速度計測器が必要で、種目・測定方法によって精度が変わる。","suited":"速度センサーを利用できる指導環境","check":"平均挙上速度・速度低下・反復間のばらつき","caution":"安全性・回復・種目条件に合わせて調整する。"},"コントラスト法":{"meaning":"高負荷の運動と軽負荷・爆発的運動を組み合わせる。","purpose":"大きな力と素早い力発揮を練習する。","pros":"強度差のある刺激を意図的に配置できる。","cons":"疲労で爆発的動作の質が落ちる場合があり、即時効果は個人差が大きい。","suited":"基礎筋力と動作技能のある競技者","check":"ジャンプ・速度・接地などの実測結果","caution":"安全性・回復・種目条件に合わせて調整する。"},"ダブルプログレッション":{"meaning":"例：設定した回数範囲の上限に達したら、次回は重量を少し調整。","purpose":"回数と重量を段階的に増やす","pros":"重量だけでなく回数達成も進歩として記録できる。","cons":"回数上限ばかり追うとフォームの質や痛みを見落としやすい。","suited":"筋肥大・基礎筋力を安全に積み上げたい人","check":"反復回数、RIR、可動域、痛みの変化","caution":"可動域を狭めて回数だけ増やすことを避ける。"},"テンポコントロール":{"meaning":"下降・静止・上昇の時間を変え、同一負荷で動作と症状を比較。","purpose":"動作時間を調整し制御を学ぶ","pros":"反復テンポを一定にして実施条件を揃えやすい。","cons":"遅いテンポ自体に筋肥大の優越性は保証されない。","suited":"関節運動と負荷のかけ方を観察したい人","check":"可動域、コントロール、速度、本人の感覚","caution":"遅いほど優れているわけではなく競技速度との使い分けが必要。"},"片側・片脚トレーニング":{"meaning":"片脚支持→ステップ→ランジなどへ段階化。左右差の強制的なゼロ化は目的にしない。","purpose":"左右それぞれの課題と支持能力をみる","pros":"左右個別の課題と動作差を観察しやすい。","cons":"バランス制約で扱える重量が下がり、全体の最大筋力とは別評価になる。","suited":"歩行・走行・ステップ・着地の個別能力を高めたい人","check":"支持時間、安定性、片側のパフォーマンス","caution":"左右差＝異常とせず、転倒リスクや課題に応じ支持物を利用。"},"バリスティック・パワー":{"meaning":"軽いメディシンボールスローなど、制御しやすい道具で実施。","purpose":"負荷を速く動かし力発揮速度を高める","pros":"加速を意図した力発揮を反復できる。","cons":"速度優先で動作制御を失うと危険。競技動作に直結する保証もない。","suited":"基礎筋力と操作技能がある人","check":"投射距離、速度、再現性","caution":"投げる方向と周辺安全を確保。高速度＝高重量にしない。"},"スプリント加速":{"meaning":"短距離の加速走で姿勢・接地・タイムを比較。","purpose":"初速を高める方向と接地を学ぶ","pros":"加速局面の接地・姿勢・ステップを検討できる。","cons":"加速のタイムは距離・スタート条件・路面に強く影響される。","suited":"短距離、球技の走り出し","check":"0–10mなど同じ距離のタイム、接地位置、痛み","caution":"疲労時に高速度反復を大量に重ねない。"},"減速・方向転換":{"meaning":"低速の減速→角度のある方向転換→競技反応課題へ段階化。","purpose":"止まる・切り返す能力を高める","pros":"減速してから進行方向を変える技能に焦点を当てられる。","cons":"方向転換の実績は減速・再加速・技術が混在し、単一指標では説明できない。","suited":"バスケ、バレー、サッカー、テニス等","check":"減速距離、方向転換時間、安定性、症状","caution":"膝の形だけでフォーム異常を断定しない。"},"反復スプリント":{"meaning":"短距離の反復と十分な回復を設計し、後半の落ち込みを確認。","purpose":"短い高強度運動を繰り返す能力を育てる","pros":"短い回復を挟んだ繰り返し疾走能力を練習できる。","cons":"高い疲労を招きやすく、連続した高強度日の設定に注意がいる。","suited":"間欠的な球技","check":"各本のタイム低下率、総距離、主観的疲労","caution":"競技練習との合計走行負荷と暑熱条件を管理。"},"ゾーン2持久運動":{"meaning":"会話できる程度など個人に合う継続強度で運動。","purpose":"比較的持続可能な強度で有酸素能力を育てる","pros":"比較的低強度で持久運動量を確保しやすい。","cons":"ゾーン区分は個人差が大きく、心拍だけの固定値で処方しない。","suited":"長距離、自転車、基礎持久力","check":"同じ時間・主観強度での距離、心拍、回復","caution":"心拍ゾーンは個体差があり推定値を絶対視しない。"},"閾値・テンポ練習":{"meaning":"適切に調整した一定時間のテンポ走・ペダリングを行う。","purpose":"継続できる比較的高い運動強度を伸ばす","pros":"一定以上の持続的努力を段階的に練習できる。","cons":"頻度や時間を増やしすぎると回復負担や競技練習と干渉しうる。","suited":"持久競技の中級者以上","check":"一定ペースでの継続時間、RPE、回復","caution":"レース前に過剰に詰め込まない。"},"HIIT（高強度インターバル）":{"meaning":"短い運動と回復を繰り返す。強度・比率は対象に合わせて設定。","purpose":"強弱を繰り返し高強度耐性を高める","pros":"短時間で高強度の刺激を設計しやすい。","cons":"高い心肺負担があり、頻度と回復を調整しないと継続しにくい。","suited":"基礎が整い高強度への適応が可能な人","check":"同一反復数でのペース低下、回復、症状","caution":"未経験者・症状のある人へ一律の高強度処方をしない。"},"テーパー（試合前調整）":{"meaning":"量を減らしつつ競技特異的な短い刺激を残す。","purpose":"疲労を減らし技能・強度を保って本番を迎える","pros":"競技前の疲労を下げながら動きの質を確認できる。","cons":"量を減らしすぎると準備感が下がる場合があり、期間や強度に個人差がある。","suited":"大会直前の競技者","check":"主観的回復、動きのキレ、練習タイム","caution":"ピーク直前に新しい高負荷プログラムを導入しない。"},"デロード（負荷軽減週）":{"meaning":"量・負荷・難度を状況に応じて減らし、技術練習を維持。","purpose":"蓄積疲労を管理し再び適応する余裕を作る","pros":"累積疲労を整理し、次の練習に向けた余裕を作れる。","cons":"軽減が短すぎても長すぎても、目的に合わない可能性がある。","suited":"疲労が積み重なるトレーニング期","check":"疲労、睡眠、疼痛、次週の反復品質","caution":"休息期間を必ず固定週にするより本人の状態を優先。"}};
function localizeMethodGuide(){const name=document.querySelector('[data-method].active')?.getAttribute('data-method'),card=document.querySelector('#smg-evolink .smg-card'),j=methodJapanese[name],e=window.EVOLINK_METHOD_DETAILS?.find(x=>x.name===name);if(!card||!j||!e)return;const row=language==='ja'?j:e;const fields=['meaning','purpose','pros','cons','suited','check'];for(const [i,dd]of [...card.querySelectorAll('dd')].entries()){const text=row[fields[i]];if(text&&dd.textContent!==text)dd.textContent=text}const note=card.querySelector('.smg-note'),text=(language==='ja'?'注意：':'Caution: ')+row.caution;if(note&&note.textContent!==text)note.textContent=text;}
const protectedContent='#smg-evolink dd,#smg-evolink .smg-note,script,style,textarea,input,pre,code,[contenteditable],.aligned-heading h1,[data-evolink-original],#ai-transcript,#ai-reflection-result,#ai-adapt-summary,#coach-memory-history textarea,#coach-saved-memory textarea,#coach-saved-memory summary,#completion-saved-reflections article,#completion-restore-differences pre,#weeklySaved .detail,.logitem:has([data-delete-note]) small,.logitem:has([data-delete-log])>div,#coachReportExercise option:not([value="all"]),#adaptExercise option[value],[data-analysis-exercise]:not([data-analysis-exercise="all"]),[data-s30-field="exercise"] option:not([value=""])';

// Only these code-owned numeric/date templates may use parameterized translation.
const dynamicJa=[/^直近7日（\d{4}-\d{2}-\d{2}〜\d{4}-\d{2}-\d{2}）と前7日（\d{4}-\d{2}-\d{2}〜\d{4}-\d{2}-\d{2}）を比較。入力されていない日は「未記録」とし、ゼロ摂取・休養と決めつけません。$/,/^前週 \d+日 · 記録SET \d+（前週 \d+）$/,/^記録済み日の平均 (?:—|[\d,.]+ kcal) ／日$/,/^(?:食事|運動)の記録率 \d+\/7日$/,/^入力された食事の合計 [\d,]+ kcal。未入力の食事がある可能性があるため、摂取不足・超過とは判断しません。$/,/^入力した実施記録 \d+件、総SET \d+。加重挙上量 [\d,.]+ kg（重量入力のある種目のみ、能力指標ではありません）。$/,/^食事記録のない日が\d+日あります。1日の全食事を入力したか確認。$/,/^異なる日の体重測定がまだ2件ありません。MIRRORで日付付き記録を追加できます。$/,/^今週の回復記録は\d+\/7日。未記録日を問題なしとは扱いません。$/,/^食事を入力した日：\d+\/\d+日／回復を記録した日：\d+\/\d+日／体重を測定した日：\d+\/\d+日。$/,/^\d+日測定 · 食事\d+\/7日$/,/^運動記録 \d+日 → \d+日$/,/^変更前 (?:未設定|[\d,]+ kcal／日)。維持案を選択中。変更はまだ行いません。$/,/^未入力の材料：(運動記録|食事目標|身体の測定)(・(運動記録|食事目標|身体の測定))*。記録が揃っていない場合、効果・原因・優劣は判定しません。$/,/^この献立例の合計は約[\d,]+kcal。目標kcalと自動で一致させていません。食品成分は試作用概算値であり、精密な栄養計算や医療用食事指導には使用しないでください。$/,/^(?:4|8|12)週間$/,/^\/ (?:4|8|12)週$/];
function dynamicPair(t){let m;if(m=t.match(/^([\s\S]+)：([\d.]+)kg × (\d+)回 × (\d+)SET を次回予定として登録しますか？ 実施ログと週間プランは変更されません。$/))return {ja:t,en:m[1]+': register '+m[2]+' kg × '+m[3]+' reps × '+m[4]+' sets as the next-session plan? Workout logs and weekly plans remain unchanged.'};if(m=t.match(/^(\d{4}-\d{2}-\d{2}) の回復記録を更新しますか？$/))return {ja:t,en:'Update the recovery record for '+m[1]+'?'};if(m=t.match(/^NUTRITIONの設定値を ([\d.]+) → ([\d.]+) kcal／日に変更しますか？ 実際の食事記録、週間運動計画、以前の目標履歴は変更しません。$/))return {ja:t,en:'Change the NUTRITION target from '+m[1]+' to '+m[2]+' kcal/day? Food logs, weekly training plans and previous target history remain unchanged.'};if(m=t.match(/^SET (\d+)の実施内容を確認してください$/))return {ja:t,en:'Check the performed values for SET '+m[1]+'.'};if(m=t.match(/^(計算保留|計算を停止|判定できません)：([\s\S]+)$/)){if(Object.hasOwn(dictionary,m[2]))return {ja:t,en:'Calculation stopped: '+dictionary[m[2]]}};const parts=t.split('／');if(parts.length>1&&parts.every(x=>Object.hasOwn(dictionary,x)))return {ja:t,en:parts.map(x=>dictionary[x]).join(' / ')};if(m=t.match(/^運動 (記録あり|未記録) ・ 食事 (記録あり|未記録) ・ 測定 (記録あり|未記録)$/))return {ja:t,en:'Training: '+(dictionary[m[1]]||m[1])+' / Food: '+(dictionary[m[2]]||m[2])+' / Measurements: '+(dictionary[m[3]]||m[3])};if(m=t.match(/^(.+?)( ✓|｜PROGRAM PREVIEW)$/)){if(window.EVOLINK_METHOD_DETAILS?.some(x=>x.name===m[1]))return {ja:t,en:(dictionary[m[1]]||m[1])+(m[2]===' ✓'?' ✓':' | PROGRAM PREVIEW')}};if(dynamicJa.some(re=>re.test(t)))return {ja:t,en:translate(t)};
if(m=t.match(/^表示 (\d+) \/ (\d+)方式。選択した方法は実施記録にも反映。重量の自動処方は方式によって異なります。$/))return {ja:t,en:'Showing '+m[1]+' / '+m[2]+' methods. Actual method use is recorded separately. Load support differs by method.'};
if(m=t.match(/^（(筋力・周期設計|セット・筋肥大|瞬発・競技|持久・コンディショニング)）$/))return {ja:t,en:'('+translate(m[1])+')'};
if(m=t.match(/^注意：([\s\S]+)$/)){const raw=m[1],ja=inverse.get(raw)||raw,en=dictionary[raw]||raw;if(Object.hasOwn(dictionary,raw)||inverse.has(raw))return {ja:'注意：'+ja,en:'Caution: '+en}}
if(m=t.match(/^(目的|目標|摂取|差)：(未設定|Not set|Not recorded|Unavailable|減量|増量|維持|競技力|[\d,.]+ ?(?:kcal|g))$/)){const labels={目的:'Goal',目標:'Target',摂取:'Intake',差:'Difference'},values={減量:'Fat loss',増量:'Muscle gain',維持:'Maintain',競技力:'Sport'},v=m[2],j=inverse.get(v)||v;return {ja:m[1]+'：'+j,en:labels[m[1]]+': '+(values[v]||dictionary[j]||v)}}
if(m=t.match(/^約([\d,.]+) kcal$/))return {ja:t,en:'About '+m[1]+' kcal'};
if(m=t.match(/^(\d+) \/ 7 recorded days$/))return {ja:m[1]+' / 7日記録',en:t};
if(m=t.match(/^7 days ending (\d{4}-\d{2}-\d{2})\. Weekly goals and growth rate are not set\. Missing records do not mean rest or zero intake\.$/))return {ja:m[1]+'までの7日間。週間目標・成長率は未設定。未記録を休養・ゼロ摂取とは扱いません。',en:t};
if(m=t.match(/^(?:(\d+) food entries · reference-food estimates|No food entries for this date\.) Training: (Recorded|Not recorded) · Measurements: (Recorded|Not recorded)$/))return {ja:(m[1]?m[1]+'件の食事記録から概算。':'この日の食事記録はありません。')+' 運動：'+(m[2]==='Recorded'?'記録あり':'未記録')+'・測定：'+(m[3]==='Recorded'?'記録あり':'未記録'),en:t};
if(m=t.match(/^(Disconnected mode|MOCK dialogue|Recorded real AI response|Responses API format fixture) · external API OFF · gpt-5\.4-mini configured · (local history enabled|tab memory only)$/))return {ja:({ 'Disconnected mode':'未接続','MOCK dialogue':'模擬対話','Recorded real AI response':'保存済み実AI応答','Responses API format fixture':'応答形式の模擬検証'}[m[1]])+'・実API送信OFF・gpt-5.4-mini設定・'+(m[2]==='local history enabled'?'履歴保存あり':'このタブのみ'),en:t};
return null;}

function pair(value){const t=value.trim();if(!t)return null;let ja,en;if(Object.hasOwn(dictionary,t)){ja=t;en=dictionary[t]}else if(inverse.has(t)){ja=inverse.get(t);en=t}else if(fixedSourceTexts.has(t)){ja=t;en=translate(t)}else if(/^\d{4}-\d{2}-\d{2} · 入力済みのみ$/.test(t)){ja=t;en=t.replace('入力済みのみ','Recorded entries only')}else if(/^\d{4}-\d{2}-\d{2} · Recorded entries only$/.test(t)){en=t;ja=t.replace('Recorded entries only','入力済みのみ')}else{const dynamic=dynamicPair(t);if(!dynamic)return null;ja=dynamic.ja;en=dynamic.en}const lead=value.match(/^\s*/)[0],tail=value.match(/\s*$/)[0];return {ja:lead+ja+tail,en:lead+en+tail,last:value}}
function protectReasons(){for(const el of document.querySelectorAll('#weeklySaved .detail'))el.setAttribute('data-evolink-original','');for(const small of document.querySelectorAll('#kcalAuditTrail .logitem small')){if(small.querySelector('[data-original-reason]'))continue;for(const node of [...small.childNodes])if(node.nodeType===3&&/^\s*理由：/.test(node.data)){const raw=node.data.replace(/^\s*理由：/,'');const label=document.createTextNode('理由：'),reason=document.createElement('span');reason.dataset.evolinkOriginal='';reason.dataset.originalReason='';reason.textContent=raw;node.replaceWith(label,reason)}}}
function update(){if(document.body.classList.contains('v13-top'))return;protectReasons();localizeMethodGuide();for(const option of document.querySelectorAll('option:not([value])'))option.setAttribute('value',option.value);for(const img of document.querySelectorAll('.brand img,.mobile-brand img,.ref-side-logo img,.ref-center-logo')){if(!img.src.endsWith('/assets/logo-display-transparent.png'))img.src='/assets/logo-display-transparent.png'}for(const img of document.querySelectorAll('img[alt*="ZEN"]')){img.hidden=true;img.setAttribute('aria-hidden','true')}
const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);for(const node of nodes){if(!node.parentElement||node.parentElement.closest(protectedContent))continue;let p=textCache.get(node);if(!p||node.data!==p.last)p=pair(node.data);if(!p)continue;const next=p[language];if(node.data!==next)node.data=next;p.last=next;textCache.set(node,p)}for(const el of document.querySelectorAll('[aria-label],[placeholder],[title]')){if(el.closest(protectedContent)&&!el.matches('input,textarea'))continue;let map=attrCache.get(el);if(!map){map={};attrCache.set(el,map)}for(const key of ['aria-label','placeholder','title']){const value=el.getAttribute(key);if(!value)continue;let p=map[key];if(!p||value!==p.last)p=pair(value);if(!p)continue;const next=p[language];if(value!==next)el.setAttribute(key,next);p.last=next;map[key]=p}}
for(const b of document.querySelectorAll('[data-locale]')){const active=b.dataset.locale===language;b.setAttribute('aria-pressed',String(active));b.classList.toggle('selected',active)}document.documentElement.lang=language==='ja'?'ja':'en';const today=document.querySelector('#today');if(today){const text=new Intl.DateTimeFormat(language==='ja'?'ja-JP':'en-GB',{month:'short',day:'numeric',weekday:'short'}).format(new Date());if(today.textContent!==text)today.textContent=text}}
let scheduled=false,running=false;const observer=new MutationObserver(()=>{if(scheduled||running)return;scheduled=true;setTimeout(()=>{scheduled=false;refresh()},20)});function refresh(){if(running)return;running=true;observer.disconnect();try{update()}finally{running=false;observer.observe(document.body,{childList:true,subtree:true,characterData:true})}}function setLanguage(next){if(!['ja','en'].includes(next))return;language=next;try{localStorage.setItem(LOCALE_KEY,next)}catch{}refresh();window.dispatchEvent(new CustomEvent('evolink:locale',{detail:{language:next}}))}

function verificationTools(){if(location.search!=='?verify=1'||document.querySelector('#verification-tools'))return;const tools=document.createElement('details');tools.id='verification-tools';tools.className='panel padded';tools.style.margin='20px';tools.innerHTML='<summary>Verification tools — isolated test only</summary><button id="verification-fingerprint" type="button" class="secondary">Show saved-state fingerprint</button><pre id="verification-result" style="white-space:pre-wrap" role="status"></pre>';document.body.append(tools);tools.querySelector('button').onclick=async()=>{const raw=localStorage.getItem('sug_evolink_v13_completion_20261103')||'null',state=JSON.parse(raw),digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw)),hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');tools.querySelector('pre').textContent=JSON.stringify({sha256:hash,training:state?.logs.length||0,meals:state?.nutrition.meals.length||0,measurements:state?.bodyRecords.length||0,recovery:state?.recoveryLogs.length||0,nextPlan:state?.nextSessionPlan||null,weeklyPlan:state?.trainingPlan||null},null,2)}}

window.EVOLINK_LOCALE={get language(){return language},set:setLanguage,update:refresh,translateFixed:(value,lang=language)=>pair(value)?.[lang]??value};const originalConfirm=window.confirm.bind(window);window.confirm=message=>originalConfirm(window.EVOLINK_LOCALE.translateFixed(String(message)));verificationTools();document.addEventListener('click',e=>{const b=e.target.closest('[data-locale]');if(b){e.preventDefault();setLanguage(b.dataset.locale)}});refresh();
})();
