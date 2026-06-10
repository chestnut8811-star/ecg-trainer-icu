import type { CategoryId, Danger, WaveformDef } from '../types'

/** カテゴリ表示メタ(色は実機モニターのパラメータ配色を意識) */
export const CATEGORIES: {
  id: CategoryId
  label: string
  labelEn: string
  color: string
  border: string
}[] = [
  { id: 'basic', label: '基本調律', labelEn: 'BASIC RHYTHM', color: 'text-phos', border: 'border-phos/40' },
  { id: 'ectopic', label: '期外収縮', labelEn: 'ECTOPY', color: 'text-yellow', border: 'border-yellow/40' },
  { id: 'svt', label: '上室性不整脈', labelEn: 'SVT / AF', color: 'text-cyan', border: 'border-cyan/40' },
  { id: 'block', label: '房室ブロック・徐脈性', labelEn: 'AV BLOCK', color: 'text-orange', border: 'border-orange/40' },
  { id: 'lethal', label: '致死性不整脈', labelEn: 'LETHAL', color: 'text-red', border: 'border-red/40' },
  { id: 'other', label: '虚血・電解質・その他', labelEn: 'ISCHEMIA / ETC', color: 'text-pink', border: 'border-pink/40' },
]

export const DANGER_META: Record<
  Danger,
  { label: string; text: string; chip: string; bar: string }
> = {
  normal: {
    label: '正常範囲',
    text: 'text-phos',
    chip: 'border-phos/50 bg-phos/10 text-phos',
    bar: 'border-phos/60',
  },
  watch: {
    label: '経過観察',
    text: 'text-amber',
    chip: 'border-amber/50 bg-amber/10 text-amber',
    bar: 'border-amber/60',
  },
  caution: {
    label: '要注意・報告',
    text: 'text-orange',
    chip: 'border-orange/50 bg-orange/10 text-orange',
    bar: 'border-orange/60',
  },
  critical: {
    label: '緊急対応',
    text: 'text-red',
    chip: 'border-red/60 bg-red/15 text-red',
    bar: 'border-red/70',
  },
}

export const WAVEFORMS: WaveformDef[] = [
  // ============================ 基本調律 ============================
  {
    id: 'nsr',
    name: '正常洞調律',
    nameEn: 'Normal Sinus Rhythm',
    abbr: 'NSR',
    category: 'basic',
    danger: 'normal',
    hr: '60–100',
    rhythm: '整',
    keyFeatures: [
      'P波→QRS→T波が規則正しく繰り返す',
      'PQ時間 0.12–0.20秒、QRS幅 0.12秒未満',
      'RR間隔はほぼ一定(呼吸でわずかに揺らぐ)',
    ],
    description:
      '洞結節から発生した興奮が正常の伝導路を通って心室へ伝わる、すべての判読の「基準」となる調律。まずこの波形を体に染み込ませることで、異常への違和感に気づけるようになる。',
    nursingPoints: [
      '患者ごとのベースライン(普段のHR・波形)を把握しておく',
      'アラーム上下限を患者の状態に合わせて設定する(鳴らないアラームは意味がない)',
      'レートだけでなくQRS幅・ST部分の変化にも日頃から目を向ける',
    ],
    firstAction: '経過観察。ベースラインとして波形と心拍数を記録しておく',
    gen: { kind: 'sinus', rate: 72 },
  },
  {
    id: 'stach',
    name: '洞性頻脈',
    nameEn: 'Sinus Tachycardia',
    abbr: 'ST',
    category: 'basic',
    danger: 'watch',
    hr: '100–150',
    rhythm: '整',
    keyFeatures: [
      'HR100以上だがP波がしっかり確認できる',
      '波形の形は正常洞調律と同じでテンポだけ速い',
      '「徐々に」速くなり「徐々に」戻る(PSVTとの鑑別点)',
    ],
    description:
      '洞結節の興奮頻度が亢進した状態。発熱・疼痛・脱水・出血・心不全・敗血症など、頻脈そのものより「なぜ速いのか」という原因が重要。ICUでは循環血液量減少のサインとして最初に現れることも多い。',
    nursingPoints: [
      '原因検索が最優先(発熱・疼痛・不安・脱水・出血・カテコラミン)',
      '突然始まる頻拍ならPSVTを疑いP波の有無を確認する',
      '新規発症・持続する頻脈、血圧低下を伴う場合は報告',
    ],
    firstAction: '原因検索(発熱・疼痛・脱水・出血など)とバイタルサイン確認',
    gen: { kind: 'sinus', rate: 132, jitter: 0.01, shape: { tAmp: 0.25 } },
  },
  {
    id: 'sbrad',
    name: '洞性徐脈',
    nameEn: 'Sinus Bradycardia',
    abbr: 'SB',
    category: 'basic',
    danger: 'watch',
    hr: '< 60',
    rhythm: '整',
    keyFeatures: [
      'HR60未満、P-QRS-Tの形と並びは正常',
      'PQ時間・QRS幅は正常範囲',
      'RR間隔が長くゆったりした波形',
    ],
    description:
      '洞結節の興奮頻度が低下した状態。β遮断薬などの薬剤、迷走神経反射、頭蓋内圧亢進、甲状腺機能低下、低体温などが原因。鍛えられたアスリートでは生理的なことも。',
    nursingPoints: [
      'めまい・ふらつき・失神などの自覚症状の有無を確認',
      'β遮断薬・ジギタリス・抗不整脈薬など投与中の薬剤をチェック',
      'HR40未満・血圧低下・意識レベル低下があれば報告し、アトロピン投与に備える',
      '頭部疾患の患者ではクッシング徴候(徐脈+血圧上昇)も念頭に',
    ],
    firstAction: '意識・血圧・自覚症状を確認し、投与中の薬剤(β遮断薬等)をチェック',
    gen: { kind: 'sinus', rate: 42, jitter: 0.03 },
  },

  // ============================ 期外収縮 ============================
  {
    id: 'pac',
    name: '心房期外収縮',
    nameEn: 'Premature Atrial Contraction',
    abbr: 'PAC',
    category: 'ectopic',
    danger: 'watch',
    hr: '基礎調律による',
    rhythm: '基本整+早期収縮',
    keyFeatures: [
      '予定より早くP波付きのnarrow QRSが出現',
      "早期のP'波は正常のP波と形が異なる",
      'QRSの形は正常と同じ(心房起源のため)',
    ],
    description:
      '洞結節以外の心房から早期に興奮が発生したもの。健常者にもみられ単発なら臨床的意義は小さいが、頻発・連発は心房細動の前触れのことがある。',
    nursingPoints: [
      '頻度が増えていないか、連発(ショートラン)がないか観察する',
      '電解質異常・低酸素・カフェイン・ストレスなど誘因を確認',
      '頻発するときや動悸の訴えがあるときは報告',
    ],
    firstAction: '単発なら経過観察。頻度増加・連発時は報告',
    gen: { kind: 'sinus', rate: 74, ectopy: { type: 'pac', min: 3, max: 5 } },
  },
  {
    id: 'pvc',
    name: '心室期外収縮',
    nameEn: 'Premature Ventricular Contraction',
    abbr: 'PVC',
    category: 'ectopic',
    danger: 'caution',
    hr: '基礎調律による',
    rhythm: '基本整+早期収縮',
    keyFeatures: [
      '予定より早く「幅広く変形した」QRSが出現(0.12秒以上)',
      '先行するP波がない',
      'T波はQRSと逆向き、後に代償性休止期を伴う',
    ],
    description:
      '心室から早期に興奮が発生したもの。単発・単源性なら経過観察のことが多いが、「多源性(形が複数)」「連発」「R on T(先行T波の頂上付近に乗る)」はVT/VFへ移行しうる危険なPVC。急性心筋梗塞後や低K血症で要警戒。',
    nursingPoints: [
      'R on T型は心室細動の引き金になるため直ちに報告',
      '多源性・2連発以上・1分間に多発する場合も報告対象',
      '血清K・Mg値、心筋虚血の有無、ジギタリス中毒を確認',
      '二段脈(正常拍とPVCが交互)では実際の脈拍数がモニターHRの半分のことがある',
    ],
    firstAction: '単発なら経過観察。多源性・連発・R on Tは直ちに報告',
    gen: { kind: 'sinus', rate: 71, ectopy: { type: 'pvc', min: 4, max: 6 } },
  },

  // ============================ 上室性不整脈 ============================
  {
    id: 'af',
    name: '心房細動',
    nameEn: 'Atrial Fibrillation',
    abbr: 'AF',
    category: 'svt',
    danger: 'caution',
    hr: '60–180(不整)',
    rhythm: '完全不整(絶対性不整脈)',
    keyFeatures: [
      'RR間隔がバラバラで全く規則性がない',
      'P波がなく、基線が細かく揺れるf波(350–600/分)',
      'QRSはnarrow(心室内の伝導は正常)',
    ],
    description:
      '心房全体が無秩序に細かく興奮し、心房の有効な収縮が失われた状態。最大の問題は心房内血栓による脳塞栓症。心拍数が速い「頻脈性AF」では心拍出量が低下し血圧が下がる。術後ICUで最も遭遇しやすい不整脈のひとつ。',
    nursingPoints: [
      '新規発症のAFは必ず12誘導心電図を記録し医師へ報告',
      '頻脈性AF(RVR)では血圧・意識・尿量など血行動態を評価',
      '抗凝固療法の有無と出血リスクを確認',
      '自脈(触診)とモニターHRに差が出る「脈拍欠損」に注意',
    ],
    firstAction: '新規発症ならバイタル確認・12誘導心電図を記録し医師へ報告',
    gen: { kind: 'af', rrMin: 0.42, rrMax: 1.0 },
  },
  {
    id: 'afl',
    name: '心房粗動',
    nameEn: 'Atrial Flutter',
    abbr: 'AFL',
    category: 'svt',
    danger: 'caution',
    hr: '75 / 150(伝導比による)',
    rhythm: '整(伝導比が変わると段階的に変化)',
    keyFeatures: [
      '基線がノコギリの歯のような鋸歯状波(F波・約300/分)',
      'II・III・aVF誘導でF波が最も見やすい',
      '2:1伝導ならHR約150の規則的頻拍、4:1なら約75',
    ],
    description:
      '心房内を興奮がぐるぐる回る(リエントリー)不整脈。心房は約300/分で規則的に興奮し、その何回かに1回が心室へ伝わる。「規則正しいHR150前後の頻拍を見たら2:1心房粗動を疑え」は判読の鉄則。',
    nursingPoints: [
      'HR150前後の規則的頻拍では本波形を疑い12誘導を記録',
      '伝導比が突然変わり心拍数が階段状に変化することがある',
      'AFと同様に血栓塞栓リスクがあり抗凝固を確認',
      '1:1伝導に移行すると血行動態が急激に破綻するため頻脈化に注意',
    ],
    firstAction: 'バイタル確認。HR約150の規則的頻拍は粗動を疑い12誘導・報告',
    gen: { kind: 'flutter' },
  },
  {
    id: 'psvt',
    name: '発作性上室頻拍',
    nameEn: 'Paroxysmal SVT',
    abbr: 'PSVT',
    category: 'svt',
    danger: 'caution',
    hr: '150–250',
    rhythm: '整(完全に規則的)',
    keyFeatures: [
      '突然始まり突然止まる narrow QRS の頻拍',
      'P波はQRSに隠れて確認困難',
      'RR間隔は機械のように正確',
    ],
    description:
      '房室結節などを介したリエントリーによる頻拍(AVNRT/AVRTなど)。「スイッチが入ったように」突然150–250/分の頻拍が始まるのが特徴で、徐々に速くなる洞性頻脈と区別する。長く続くと血圧低下や心不全を招く。',
    nursingPoints: [
      '血圧・意識・胸部症状を確認し血行動態を評価',
      '発作中の12誘導心電図を必ず記録(診断の決め手になる)',
      '修正バルサルバ手技の介助、ATP(アデノシン)急速静注の準備',
      'ATP投与時は一過性の心停止様ポーズが出ることを知っておく',
    ],
    firstAction: '血圧・意識を確認し医師報告。修正バルサルバ・ATP投与の準備',
    gen: { kind: 'sinus', rate: 185, jitter: 0.004, shape: { pAmp: 0, tAmp: 0.2, tMu: 0.26 } },
  },

  // ============================ 房室ブロック・徐脈性 ============================
  {
    id: 'avb1',
    name: '1度房室ブロック',
    nameEn: 'First-degree AV Block',
    abbr: 'AVB I°',
    category: 'block',
    danger: 'watch',
    hr: '60–100',
    rhythm: '整',
    keyFeatures: [
      'PQ時間が0.20秒を超えて一定に延長',
      'P波の後に必ずQRSが続く(脱落はない)',
      'PとQRSの間隔が「遠距離恋愛」のように離れている',
    ],
    description:
      '房室結節での伝導が遅くなった状態。すべての興奮は心室へ伝わるため基本的に良性で無症状。ただし薬剤(β遮断薬・Ca拮抗薬・ジギタリス)の影響や、より高度なブロックへの進展に注意。',
    nursingPoints: [
      '基本は経過観察。新規出現時は投与薬剤を確認し報告',
      'PQ時間の推移を記録し、高度ブロックへの進展がないか観察',
      '徐脈や失神などの症状が出れば報告',
    ],
    firstAction: '経過観察。新規出現時は薬剤を確認して報告',
    gen: { kind: 'sinus', rate: 66, shape: { pr: 0.34 } },
  },
  {
    id: 'wen',
    name: '2度房室ブロック(ウェンケバッハ型)',
    nameEn: 'Second-degree AV Block, Mobitz I',
    abbr: 'Mobitz I',
    category: 'block',
    danger: 'watch',
    hr: '徐脈傾向',
    rhythm: '群拍動(パターンのある不整)',
    keyFeatures: [
      'PQ時間が一拍ごとに徐々に延長していく',
      'ついにQRSが1拍脱落し、また最初から繰り返す',
      'RR間隔が「だんだん詰まって1回抜ける」群拍動を示す',
    ],
    description:
      '房室結節レベルの伝導障害。迷走神経緊張の強い夜間や若年者にもみられ、比較的良性。ジギタリスやβ遮断薬でも生じる。モビッツII型との鑑別(PQが延びるかどうか)が判読の核心。',
    nursingPoints: [
      '無症状なら経過観察でよいことが多い',
      '夜間睡眠中など迷走神経緊張時に出やすいことを知っておく',
      'めまい・失神などの症状や高度な徐脈があれば報告',
      'II型との鑑別のためPQ時間の変化を記録しておく',
    ],
    firstAction: '自覚症状と心拍数を確認し経過観察(症状があれば報告)',
    gen: { kind: 'wenckebach' },
  },
  {
    id: 'mob2',
    name: '2度房室ブロック(モビッツII型)',
    nameEn: 'Second-degree AV Block, Mobitz II',
    abbr: 'Mobitz II',
    category: 'block',
    danger: 'caution',
    hr: '徐脈傾向',
    rhythm: '突然の脱落を伴う',
    keyFeatures: [
      'PQ時間は一定のまま、予告なく突然QRSが脱落',
      '脱落の前後でPQ時間に変化がない',
      'P波は規則正しく出続けている',
    ],
    description:
      'ヒス束以下の伝導障害で、ウェンケバッハ型より重症。完全房室ブロックへ突然移行する危険が高く、ペースメーカーの適応となることが多い。「PQが延びずにいきなり落ちる」のが見分けポイント。',
    nursingPoints: [
      '発見したら直ちに医師へ報告(急変リスクの高いブロック)',
      '経皮ペーシングや体外式ペースメーカーの準備を確認',
      'アトロピンは無効〜悪化のこともあり指示を確認',
      '失神(アダムス・ストークス発作)への転倒対策',
    ],
    firstAction: '直ちに医師へ報告し、経皮ペーシングの準備を確認',
    gen: { kind: 'mobitz2' },
  },
  {
    id: 'avb3',
    name: '3度(完全)房室ブロック',
    nameEn: 'Third-degree (Complete) AV Block',
    abbr: 'AVB III°',
    category: 'block',
    danger: 'critical',
    hr: '30–50(補充調律)',
    rhythm: 'PとQRSが無関係(房室解離)',
    keyFeatures: [
      'P波とQRSがまったく無関係に独立して出現',
      'P波は規則的(約60–100/分)、QRSはゆっくり(30–50/分)',
      '補充調律がヒス束以下由来だとQRSは幅広',
    ],
    description:
      '心房の興奮が心室へ全く伝わらず、心室は補充調律でかろうじて動いている状態。心拍出量が大きく低下し、失神(アダムス・ストークス発作)や心停止に直結する緊急疾患。下壁梗塞や薬剤、術後にも生じる。',
    nursingPoints: [
      '直ちに医師へ報告・応援要請(緊急ペーシングの適応)',
      '経皮ペーシングをすぐ使えるよう準備し、意識レベルを継続監視',
      '失神・転倒に備えベッド上安静、除細動器を近くに',
      'アトロピンが効きにくいタイプがあることを知っておく',
    ],
    firstAction: '直ちに医師報告・応援要請。経皮ペーシング準備と意識レベル監視',
    alarmLabel: 'AVB III°',
    gen: { kind: 'avb3' },
  },
  {
    id: 'pause',
    name: '洞停止(洞房ブロック)',
    nameEn: 'Sinus Arrest / Sinus Pause',
    abbr: 'PAUSE',
    category: 'block',
    danger: 'caution',
    hr: 'ポーズ中は0',
    rhythm: '突然の長い休止',
    keyFeatures: [
      'P波ごと(P-QRS-Tまるごと)突然欠落し長いポーズになる',
      'ポーズの前後の波形は正常',
      '3秒以上のポーズは失神のリスク',
    ],
    description:
      '洞結節が一時的に興奮を出さなくなる(または伝わらなくなる)状態。洞不全症候群(SSS)の一表現で、徐脈頻脈症候群として頻拍停止直後に長いポーズが出ることも。3秒以上の停止や症状があればペースメーカー適応を検討。',
    nursingPoints: [
      'ポーズの長さ(秒数)を測定し、出現時刻とともに記録・報告',
      'めまい・眼前暗黒感・失神の有無を確認',
      '頻拍(AFなど)停止直後のポーズに特に注意して観察',
      '3秒以上のポーズや症状を伴う場合は緊急性が高い',
    ],
    firstAction: 'ポーズの長さと自覚症状を確認して報告(3秒以上は緊急性が高い)',
    gen: { kind: 'pause', rate: 72 },
  },

  // ============================ 致死性不整脈 ============================
  {
    id: 'vt',
    name: '心室頻拍',
    nameEn: 'Ventricular Tachycardia',
    abbr: 'VT',
    category: 'lethal',
    danger: 'critical',
    hr: '120–250',
    rhythm: '整(ほぼ規則的)',
    keyFeatures: [
      '幅広いQRS(0.12秒以上)が規則的に高頻度で連続',
      'P波は確認できない(房室解離)',
      '30秒以上続くものは持続性VT',
    ],
    description:
      '心室を起源とする頻拍。心筋梗塞後・心筋症などが背景にあることが多い。脈が触れる「脈ありVT」か「無脈性VT」かで対応が一変し、無脈性VTは心停止として直ちに除細動の適応。VFへ移行しうる超緊急波形。',
    nursingPoints: [
      '波形を見たら「まず患者」— 意識と頸動脈の脈拍を確認',
      '応援要請し救急カート・除細動器を準備',
      '無脈性なら直ちにCPR開始+除細動(心停止アルゴリズム)',
      '脈ありなら12誘導記録・静脈路確保・抗不整脈薬や同期下カルディオバージョンの準備',
    ],
    firstAction: 'まず意識・脈拍を確認。無脈性なら直ちにCPR・除細動',
    alarmLabel: 'VT',
    gen: { kind: 'vt', rate: 175 },
  },
  {
    id: 'tdp',
    name: 'トルサード・ド・ポアンツ',
    nameEn: 'Torsades de Pointes',
    abbr: 'TdP',
    category: 'lethal',
    danger: 'critical',
    hr: '200–250',
    rhythm: '不整(多形性)',
    keyFeatures: [
      'QRSの振幅と向きが「ねじれる」ように周期的に変化',
      '紡錘形(スピンドル状)に膨らんだり細くなったりする',
      '背景にQT延長がある(薬剤・低K・低Mg・徐脈)',
    ],
    description:
      'QT延長を背景に生じる多形性心室頻拍。「棘波のねじれ」という名の通り、QRSが基線の周りをねじれるように変化する。自然停止と再発を繰り返し、VFへ移行して突然死の原因となる。抗不整脈薬・抗精神病薬・抗菌薬など薬剤性も多い。',
    nursingPoints: [
      '応援要請・除細動器準備(VF移行に備える)',
      '硫酸マグネシウム静注の準備(第一選択薬)',
      'QT延長をきたす薬剤を確認し中止について医師と協議',
      '血清K・Mg値の確認、徐脈があれば一時ペーシングも視野',
    ],
    firstAction: '応援要請・除細動器準備。硫酸マグネシウム投与の準備',
    alarmLabel: 'TdP',
    gen: { kind: 'tdp' },
  },
  {
    id: 'vf',
    name: '心室細動',
    nameEn: 'Ventricular Fibrillation',
    abbr: 'VF',
    category: 'lethal',
    danger: 'critical',
    hr: '測定不能',
    rhythm: '無秩序',
    keyFeatures: [
      'P波もQRSも同定できない無秩序な基線の揺れのみ',
      '振幅も間隔もバラバラ(粗動波→次第に細かくなる)',
      '有効な心拍出はゼロ=心停止',
    ],
    description:
      '心室の心筋がてんでばらばらに震え、ポンプ機能が完全に失われた状態。発生から1分ごとに救命率が約7–10%低下するとされ、唯一の根本治療は電気的除細動。ICUナースが絶対に見逃してはならない波形の筆頭。',
    nursingPoints: [
      '患者の意識・呼吸を確認(電極外れ・アーチファクトとの鑑別も同時に)',
      '大声で応援要請・院内救急コール、直ちにCPR開始',
      '除細動器を装着し可及的速やかに電気ショック',
      '微細なVFは平坦に見えることがある—感度(ゲイン)を上げて確認',
    ],
    firstAction: '直ちに応援要請・CPR開始、除細動(電気ショック)の施行',
    alarmLabel: 'VF',
    gen: { kind: 'vf' },
  },
  {
    id: 'asys',
    name: '心静止',
    nameEn: 'Asystole',
    abbr: 'ASYS',
    category: 'lethal',
    danger: 'critical',
    hr: '0',
    rhythm: '—',
    keyFeatures: [
      'ほぼ平坦な基線(完全な直線とは限らない)',
      'P波・QRS・T波のいずれも出現しない',
      '電極外れ・微細VFとの鑑別が必須',
    ],
    description:
      '心臓の電気活動が完全に停止した状態。除細動の適応は「ない」ことがVFとの決定的な違いで、質の高いCPRとアドレナリン投与、原因(4H4T)の検索・是正が治療の柱となる。',
    nursingPoints: [
      'まず患者を確認—本当に心停止か、電極が外れていないか',
      '誘導を変える・感度を上げるなどして微細VFでないことを確認',
      '応援要請・CPR開始、アドレナリン投与の準備(除細動は適応外)',
      '4H4T(低酸素・循環血液量減少・高/低K・低体温、緊張性気胸・タンポナーデ・中毒・血栓塞栓)を意識',
    ],
    firstAction: '患者と電極を確認し、応援要請・CPR開始(除細動は適応外)',
    alarmLabel: 'ASYSTOLE',
    gen: { kind: 'asystole' },
  },

  // ============================ 虚血・電解質・その他 ============================
  {
    id: 'stemi',
    name: 'ST上昇(急性心筋梗塞)',
    nameEn: 'ST Elevation (STEMI pattern)',
    abbr: 'ST↑',
    category: 'other',
    danger: 'critical',
    hr: '60–100',
    rhythm: '整',
    keyFeatures: [
      'ST部分が基線より明らかに上昇(弓状・墓石状)',
      'T波と融合した「単一の山」のように見えることも',
      '対側誘導ではST低下(ミラーイメージ)を示す',
    ],
    description:
      '冠動脈の閉塞により心筋が貫壁性の虚血に陥ったサイン。発症からの時間がそのまま心筋の壊死量になる時間勝負の疾患(Time is muscle)。モニター1誘導でもST変化に「気づける」ことが救命の第一歩。',
    nursingPoints: [
      '直ちに12誘導心電図を記録し医師へ報告(モニターだけで判断しない)',
      '胸痛・冷汗・嘔気などの症状とバイタルを評価',
      '静脈路確保・採血(心筋逸脱酵素)・酸素化の評価',
      '再灌流療法(カテーテル治療)への移動準備、致死性不整脈の出現に厳重警戒',
    ],
    firstAction: '直ちに12誘導心電図を記録し医師へ報告',
    alarmLabel: 'ST↑',
    gen: { kind: 'sinus', rate: 88, shape: { stDome: 0.34, tAmp: 0.42, tSigma: 0.07, tMu: 0.34 } },
  },
  {
    id: 'hyperk',
    name: 'テント状T波(高カリウム血症)',
    nameEn: 'Tented T (Hyperkalemia)',
    abbr: 'K↑',
    category: 'other',
    danger: 'caution',
    hr: '徐脈傾向',
    rhythm: '整',
    keyFeatures: [
      '左右対称で幅が狭く、先の尖った背の高いT波',
      'P波の平低化、QRS幅の拡大を伴っていく',
      '進行するとサインカーブ様→VF・心静止へ',
    ],
    description:
      '高カリウム血症の最初の心電図サイン。K値の上昇とともに P波消失→QRS開大→サインカーブと進行し、突然心停止に至る。腎不全・透析患者、K製剤投与中、大量輸血、挫滅症候群などで要警戒。',
    nursingPoints: [
      '医師へ報告し、採血で血清K値を確認',
      '投与中のK製剤・K含有輸液を確認し、中止の指示を仰ぐ',
      'グルコン酸カルシウム静注やGI(グルコース・インスリン)療法の準備',
      '透析患者では透析前の時間帯に特に注意',
    ],
    firstAction: '医師報告と採血(K値)確認。投与中のK製剤を確認し中止に備える',
    gen: {
      kind: 'sinus',
      rate: 52,
      shape: { pAmp: 0.04, widthScale: 1.5, tAmp: 0.8, tSigma: 0.027, tMu: 0.32 },
    },
  },
  {
    id: 'paced',
    name: 'ペースメーカー調律(VVI)',
    nameEn: 'Ventricular Paced Rhythm',
    abbr: 'PACE',
    category: 'other',
    danger: 'normal',
    hr: '設定レート(例: 60)',
    rhythm: '整(設定どおり)',
    keyFeatures: [
      'QRS直前に鋭く細い「ペーシングスパイク」',
      'スパイクに続くQRSは幅広(心室から興奮が広がるため)',
      '設定レートで機械のように規則的',
    ],
    description:
      '心室ペーシングによる調律。スパイクの直後にQRSが続いていれば正常に「捕捉(キャプチャ)」できている。スパイクの後にQRSがない(ペーシング不全)、自己脈を無視して打つ(センシング不全)を見抜くことがモニター観察の要点。',
    nursingPoints: [
      '設定モード・レート・閾値を把握しておく(申し送りで必ず確認)',
      'スパイク後に必ずQRSが続くか=捕捉の確認',
      'ペーシング不全・センシング不全(アンダー/オーバー)の波形を知っておく',
      '体外式の場合は刺激部位の皮膚・電池残量・接続を定期確認',
    ],
    firstAction: '設定レートどおりの作動と、スパイク後のQRS(捕捉)を確認',
    gen: { kind: 'paced', rate: 60 },
  },
  {
    id: 'emg',
    name: '筋電図アーチファクト(電極異常)',
    nameEn: 'Muscle / Motion Artifact',
    abbr: 'EMG',
    category: 'other',
    danger: 'watch',
    hr: '基礎調律による',
    rhythm: '基礎調律は整',
    keyFeatures: [
      'VFのような不規則ノイズだが、よく見ると規則的なQRSが「透けて」見える',
      '体動・震え・電極の浮きと時間的に一致する',
      '患者は普段どおり(意識清明・脈触知可)',
    ],
    description:
      '体動・シバリング・筋緊張や電極の接触不良によるノイズ。VFと見誤って慌てる前に「波形より患者を見る」が鉄則。逆に、アーチファクトだと思い込んで本物のVFを見逃すことが最も危険。アラーム疲労対策としても電極管理は重要。',
    nursingPoints: [
      'まず患者の意識・脈拍を確認(本物のVF・VTとの鑑別が最優先)',
      'ノイズの中に規則的なQRSが見えるかを確認',
      '電極の貼り替え(清拭・除毛・位置変更)とリード断線の確認',
      '頻回のテクニカルアラームは放置せず原因を解決する(アラーム疲労の防止)',
    ],
    firstAction: 'まず患者の意識・脈拍を確認(真のVFとの鑑別)。その後電極を確認',
    gen: { kind: 'artifact', rate: 78 },
  },
]

export const byId = (id: string): WaveformDef => {
  const def = WAVEFORMS.find((w) => w.id === id)
  return def ?? WAVEFORMS[0]
}

export const byCategory = (cat: CategoryId): WaveformDef[] =>
  WAVEFORMS.filter((w) => w.category === cat)
