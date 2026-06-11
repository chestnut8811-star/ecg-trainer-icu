import type { CaseSpec, LeadId, Rhythm } from './engine'

export type Cat = 'normal' | 'ischemia' | 'conduction' | 'hypertrophy' | 'axis' | 'other'

export interface TwelveCase {
  id: string
  name: string
  nameEn: string
  cat: Cat
  /** 心電図検定の想定級(目安) */
  grade: string
  hrText: string
  axisText: string
  rhythm: Rhythm
  spec: CaseSpec
  /** 所見が顕著に出る誘導(画面でハイライト) */
  highlight: LeadId[]
  /** 12誘導判読のキー所見 */
  features: string[]
  /** 病態の簡易説明 */
  description: string
  /** 臨床・看護のポイント */
  clinical: string[]
}

export const CAT_META: Record<Cat, { label: string; color: string; border: string }> = {
  normal: { label: '正常', color: 'text-emerald-300', border: 'border-emerald-300/40' },
  ischemia: { label: '虚血・梗塞', color: 'text-red-300', border: 'border-red-300/40' },
  conduction: { label: '伝導障害', color: 'text-amber-300', border: 'border-amber-300/40' },
  hypertrophy: { label: '肥大', color: 'text-violet-300', border: 'border-violet-300/40' },
  axis: { label: '電気軸', color: 'text-sky-300', border: 'border-sky-300/40' },
  other: { label: 'その他', color: 'text-pink-300', border: 'border-pink-300/40' },
}

export const CASES: TwelveCase[] = [
  {
    id: 'normal',
    name: '正常12誘導心電図',
    nameEn: 'Normal 12-lead ECG',
    cat: 'normal',
    grade: '4–3級',
    hrText: '72 /分',
    axisText: '正常軸(約 +60°)',
    rhythm: { type: 'regular', rate: 72 },
    spec: { qrsAxis: 60, tAxis: 45, pAxis: 60 },
    highlight: ['II', 'V1', 'V6'],
    features: [
      'I・IIのP波は陽性、aVRはP・QRS・Tすべて陰性',
      'V1のrSからV6のqRへ、R波が滑らかに増高(R波増高)',
      'QRS幅0.10秒未満、ST部分は基線上、移行帯はV3–V4',
    ],
    description:
      'すべての判読の基準となる正常波形。肢誘導の極性パターン(特にaVR全陰性)と胸部誘導のR波増高を「正常の形」として体に入れておくと、異常への気づきが速くなる。',
    clinical: [
      'まず調律(洞調律か)・心拍数・電気軸・各間隔を順に確認する系統的判読を習慣に',
      'aVRが陽性になっていたら四肢電極の左右付け間違いをまず疑う',
      '施設のフォーマット(3×4+調律記録)に慣れておく',
    ],
  },
  {
    id: 'inferior_mi',
    name: '急性下壁心筋梗塞',
    nameEn: 'Acute Inferior STEMI',
    cat: 'ischemia',
    grade: '3–2級',
    hrText: '64 /分',
    axisText: '正常軸',
    rhythm: { type: 'regular', rate: 64 },
    spec: {
      qrsAxis: 55, tAxis: 45, pAxis: 60,
      st: { II: 0.3, III: 0.34, aVF: 0.3, I: -0.12, aVL: -0.16 },
      tOverride: { III: 0.5, aVF: 0.45 },
    },
    highlight: ['II', 'III', 'aVF'],
    features: [
      'II・III・aVF(下壁誘導)でST上昇',
      'I・aVLに対側性(reciprocal)ST低下',
      '責任血管は右冠動脈(RCA)が多い',
    ],
    description:
      '下壁を灌流する冠動脈(多くは右冠動脈)の閉塞。下壁誘導II・III・aVFのST上昇と、鏡像であるI・aVLのST低下がセットで現れる。房室結節枝も同血管のことが多く、徐脈や房室ブロックを合併しやすい。',
    clinical: [
      '直ちに医師へ報告し再灌流療法(緊急カテーテル)の準備、Time is muscle',
      '徐脈・房室ブロックの合併に注意し経皮ペーシングを準備',
      '右室梗塞合併時は硝酸薬で血圧が急落しうる—投与前に医師と確認',
      'V3R–V4R(右側胸部誘導)の追加記録が右室梗塞の検出に有用',
    ],
  },
  {
    id: 'anterior_mi',
    name: '急性前壁中隔心筋梗塞',
    nameEn: 'Acute Anteroseptal STEMI',
    cat: 'ischemia',
    grade: '3–2級',
    hrText: '94 /分',
    axisText: '正常軸',
    rhythm: { type: 'regular', rate: 94 },
    spec: {
      qrsAxis: 50, tAxis: 60, pAxis: 60,
      precordRmul: [0.5, 0.5, 0.6, 0.7, 1, 1],
      st: { V1: 0.28, V2: 0.4, V3: 0.42, V4: 0.3, II: -0.08, III: -0.1 },
      tOverride: { V2: 0.6, V3: 0.6 },
    },
    highlight: ['V1', 'V2', 'V3', 'V4'],
    features: [
      'V1–V4(前胸部誘導)でST上昇',
      'R波増高不良(poor R progression)を伴うことが多い',
      '責任血管は左前下行枝(LAD)',
    ],
    description:
      '左前下行枝(LAD)閉塞による広範な前壁梗塞。前胸部誘導V1–V4のST上昇が特徴で、左室の広い領域が障害されるため心不全・致死性不整脈・心原性ショックのリスクが高い「大きな梗塞」。',
    clinical: [
      '最も予後に直結する梗塞のひとつ—迅速な再灌流療法へつなぐ',
      '心室細動・心室頻拍の出現に厳重警戒し除細動器を即使用できる位置に',
      'ポンプ失調(心不全・ショック)の徴候を継続監視',
      'wide territoryのため血行動態が急変しうる',
    ],
  },
  {
    id: 'lateral_mi',
    name: '急性側壁心筋梗塞',
    nameEn: 'Acute Lateral STEMI',
    cat: 'ischemia',
    grade: '2級',
    hrText: '78 /分',
    axisText: '正常軸',
    rhythm: { type: 'regular', rate: 78 },
    spec: {
      qrsAxis: 40, tAxis: 40, pAxis: 60,
      st: { I: 0.24, aVL: 0.26, V5: 0.22, V6: 0.2, III: -0.14, aVF: -0.1 },
      tOverride: { aVL: 0.4 },
    },
    highlight: ['I', 'aVL', 'V5', 'V6'],
    features: [
      'I・aVL・V5・V6(側壁誘導)でST上昇',
      'III・aVFに対側性ST低下',
      '責任血管は左回旋枝(LCx)や対角枝',
    ],
    description:
      '左室側壁の梗塞。側壁誘導I・aVL・V5・V6のST上昇が特徴。左回旋枝病変は標準12誘導で変化が乏しい(electrically silent)ことがあり、見逃されやすいので対側性変化も手がかりにする。',
    clinical: [
      '高位側壁(I・aVL)のみのST上昇は見落としやすい—対側性ST低下に注目',
      '12誘導で所見が乏しくても症状が強ければ後壁・側壁梗塞を疑い追加誘導を',
      '再灌流療法の準備と致死性不整脈への警戒',
    ],
  },
  {
    id: 'pericarditis',
    name: '急性心膜炎',
    nameEn: 'Acute Pericarditis',
    cat: 'ischemia',
    grade: '2級',
    hrText: '92 /分',
    axisText: '正常軸',
    rhythm: { type: 'regular', rate: 92 },
    spec: {
      qrsAxis: 55, tAxis: 45, pAxis: 60,
      prDep: 0.06,
      st: {
        I: 0.14, II: 0.18, III: 0.1, aVF: 0.16, aVL: 0.06,
        V2: 0.16, V3: 0.2, V4: 0.2, V5: 0.18, V6: 0.14,
        aVR: -0.16,
      },
    },
    highlight: ['II', 'V3', 'V4', 'V5', 'V6'],
    features: [
      'びまん性(広範な)凹型ST上昇 — 単一の冠動脈支配域に一致しない',
      'aVR は対側性に ST 低下(＋PR上昇)',
      '多くの誘導で PR 部分の低下(PR depression)',
    ],
    description:
      '心膜の炎症による疾患。STEMIと違い、特定の冠動脈支配域に限らず「広い範囲」で凹型(saddle様)のST上昇を示し、aVRのST低下とPR部分の低下を伴うのが鑑別点。胸痛は体位・呼吸で変化することが多い。心タンポナーデへの進展に注意。',
    clinical: [
      'STEMI(限局性・凸型ST上昇＋対側性変化)との鑑別が最重要—12誘導全体を見る',
      '胸痛の性状(前傾で軽減・吸気で増悪)や心膜摩擦音を確認',
      '心タンポナーデ徴候(血圧低下・頸静脈怒張・心音減弱)に警戒',
      '心エコー・炎症反応の評価につなげる',
    ],
  },
  {
    id: 'hyperk12',
    name: '高カリウム血症',
    nameEn: 'Hyperkalemia',
    cat: 'other',
    grade: '3–2級',
    hrText: '58 /分',
    axisText: '正常軸',
    rhythm: { type: 'regular', rate: 58 },
    spec: {
      qrsAxis: 55, tAxis: 45, pAxis: 60,
      widthScale: 1.35,
      pMul: 0.25,
      tMul: 2.3,
      tSigma: 0.03,
    },
    highlight: ['II', 'V2', 'V3', 'V4'],
    features: [
      '左右対称で幅が狭く尖った、背の高いテント状T波(precordialで顕著)',
      'P波の平低化・QRS幅の拡大',
      '進行するとサインカーブ様となり心停止に至る',
    ],
    description:
      '血清カリウム上昇による心電図変化。テント状T波が最初のサインで、進行とともにP波平低化→QRS開大→サインカーブと変化し突然心停止に至る。腎不全・透析患者、K製剤投与中、大量輸血、挫滅症候群などで要警戒。',
    clinical: [
      '医師へ報告し血清K値を確認、投与中のK製剤・K含有輸液を中止に備える',
      'グルコン酸カルシウム静注やGI(グルコース・インスリン)療法の準備',
      '心電図変化は致死的不整脈の前兆—モニター継続と除細動器の準備',
      '透析患者では透析前の時間帯に特に注意',
    ],
  },
  {
    id: 'rbbb',
    name: '完全右脚ブロック',
    nameEn: 'Complete RBBB',
    cat: 'conduction',
    grade: '3–2級',
    hrText: '76 /分',
    axisText: '正常〜軽度右軸',
    rhythm: { type: 'regular', rate: 76 },
    spec: {
      qrsAxis: 70, tAxis: 45, pAxis: 60, widthScale: 1.75,
      special: {
        V1: [
          { mu: -0.05, amp: 0.2, sigma: 0.013 },
          { mu: 0.005, amp: -0.32, sigma: 0.016 },
          { mu: 0.075, amp: 0.72, sigma: 0.02 },
        ],
        V2: [
          { mu: -0.05, amp: 0.18, sigma: 0.013 },
          { mu: 0.005, amp: -0.4, sigma: 0.016 },
          { mu: 0.075, amp: 0.5, sigma: 0.022 },
        ],
        V6: [
          { mu: -0.04, amp: -0.05, sigma: 0.012 },
          { mu: 0, amp: 0.8, sigma: 0.013 },
          { mu: 0.09, amp: -0.34, sigma: 0.03 },
        ],
        I: [
          { mu: 0, amp: 0.52, sigma: 0.013 },
          { mu: 0.09, amp: -0.3, sigma: 0.03 },
        ],
      },
      tOverride: { V1: -0.22, V2: -0.26, V3: -0.16 },
    },
    highlight: ['V1', 'V6', 'I'],
    features: [
      'QRS幅0.12秒以上に延長',
      'V1でrSR’(M字型・rabbit ear)',
      'I・V6に幅広く緩やかなS波、V1–V3でT波陰性',
    ],
    description:
      '右脚の伝導が途絶し、右室が左室から遅れて興奮する。V1のrSR’(M字型)と幅広いQRSが特徴。基礎心疾患のない健常者にもみられるが、新規出現や症状を伴う場合は精査が必要。',
    clinical: [
      '完全右脚ブロックがあっても、ST上昇など虚血所見は比較的読める',
      '新規発症の右脚ブロック+胸痛は急性肺塞栓・前壁梗塞の可能性を考える',
      '右脚ブロック自体は無症状なら経過観察が多いが既往として申し送る',
    ],
  },
  {
    id: 'lbbb',
    name: '完全左脚ブロック',
    nameEn: 'Complete LBBB',
    cat: 'conduction',
    grade: '2級',
    hrText: '70 /分',
    axisText: '左軸偏位を伴いやすい',
    rhythm: { type: 'regular', rate: 70 },
    spec: {
      qrsAxis: 10, tAxis: 45, pAxis: 60, widthScale: 1.9,
      special: {
        V1: [{ mu: -0.02, amp: 0.06, sigma: 0.014 }, { mu: 0.02, amp: -1.0, sigma: 0.022 }],
        V2: [{ mu: -0.02, amp: 0.05, sigma: 0.014 }, { mu: 0.02, amp: -1.1, sigma: 0.024 }],
        V6: [
          { mu: -0.03, amp: 0.55, sigma: 0.018 },
          { mu: 0.06, amp: 0.62, sigma: 0.022 },
        ],
        I: [
          { mu: -0.03, amp: 0.5, sigma: 0.018 },
          { mu: 0.06, amp: 0.58, sigma: 0.022 },
        ],
        aVL: [
          { mu: -0.03, amp: 0.45, sigma: 0.018 },
          { mu: 0.06, amp: 0.5, sigma: 0.022 },
        ],
      },
      tOverride: { V1: 0.26, V2: 0.3, I: -0.24, aVL: -0.2, V5: -0.26, V6: -0.3 },
    },
    highlight: ['V1', 'V6', 'I'],
    features: [
      'QRS幅0.12秒以上、V1でQS型(深い下向き)',
      'I・aVL・V6で幅広く分裂(notch)した単峰性R波',
      'ST-T はQRSと逆向き(discordance)',
    ],
    description:
      '左脚の伝導障害で左室が遅れて興奮する。脱分極の順序が大きく乱れるため、左脚ブロック下では通常のST-Tによる虚血判定が困難になる。新規の左脚ブロック+胸痛は急性心筋梗塞に準じた対応を要することがある。',
    clinical: [
      '新規発症の左脚ブロックは急性心筋梗塞のサインのことがあり医師へ報告',
      '左脚ブロックがあるとST変化での虚血評価が難しい—症状と経過を重視',
      '基礎心疾患(心不全・心筋症)を伴うことが多く心機能評価につなげる',
    ],
  },
  {
    id: 'lvh',
    name: '左室肥大',
    nameEn: 'Left Ventricular Hypertrophy',
    cat: 'hypertrophy',
    grade: '2級',
    hrText: '74 /分',
    axisText: '左軸偏位傾向',
    rhythm: { type: 'regular', rate: 74 },
    spec: {
      qrsAxis: 5, tAxis: 45, pAxis: 60,
      precordRmul: [1, 1, 1, 1.2, 1.7, 1.6],
      precordSmul: [1.7, 1.8, 1.2, 0.8, 0.5, 0.4],
      st: { V5: -0.14, V6: -0.14, I: -0.1, aVL: -0.1 },
      tOverride: { V5: -0.32, V6: -0.34, I: -0.2, aVL: -0.16 },
    },
    highlight: ['V1', 'V2', 'V5', 'V6'],
    features: [
      '高電位(SV1 + RV5/V6 が大きい・Sokolow-Lyon基準)',
      'V5・V6・I・aVLでST低下と陰性T(strain pattern)',
      '左軸偏位を伴いやすい',
    ],
    description:
      '高血圧・大動脈弁狭窄などによる左室心筋の肥大。胸部誘導の高い電位と、側壁誘導のストレイン(ST低下・陰性T)が特徴。心房細動や心不全の素地となる。',
    clinical: [
      '高血圧・弁膜症など背景疾患の把握と血圧管理',
      'strainパターンの陰性Tを虚血と即断しない(既往波形との比較が有用)',
      '心房細動・心不全の合併に注意',
    ],
  },
  {
    id: 'wpw',
    name: 'WPW症候群',
    nameEn: 'WPW Syndrome',
    cat: 'other',
    grade: '2–1級',
    hrText: '78 /分',
    axisText: '副伝導路により変化',
    rhythm: { type: 'regular', rate: 78 },
    spec: {
      qrsAxis: 55, tAxis: 45, pAxis: 60, widthScale: 1.4,
      delta: true, prShort: true,
      tOverride: { V1: -0.15, II: 0.3 },
    },
    highlight: ['II', 'V2', 'V4'],
    features: [
      'PR(PQ)時間の短縮(<0.12秒)',
      'QRS立ち上がりの緩やかな傾斜=デルタ波',
      'QRS幅の延長(副伝導路Kent束による早期興奮)',
    ],
    description:
      '心房と心室をつなぐ副伝導路(Kent束)が存在し、房室結節を介さず心室が早期に興奮する。短いPR・デルタ波・幅広QRSが三徴。発作性上室頻拍(AVRT)を起こし、心房細動を合併すると極めて速い心室応答で危険となりうる。',
    clinical: [
      '頻拍発作時は12誘導を記録—デルタ波の有無で機序の推定に役立つ',
      'WPW+心房細動では房室結節抑制薬(ジギタリス等)が禁忌のことがあり要注意',
      '根治はカテーテルアブレーション、適応を医師と共有',
    ],
  },
  {
    id: 'af12',
    name: '心房細動(12誘導)',
    nameEn: 'Atrial Fibrillation',
    cat: 'other',
    grade: '4–3級',
    hrText: '不整(約90)',
    axisText: '正常軸',
    rhythm: { type: 'af', rate: 90 },
    spec: { qrsAxis: 55, tAxis: 45, pAxis: 60, afNoP: true },
    highlight: ['II', 'V1'],
    features: [
      'P波がなく、基線が細かく揺れるf波(V1で見やすい)',
      'RR間隔が完全に不規則(絶対性不整脈)',
      'QRS幅は正常(narrow)',
    ],
    description:
      '心房が無秩序に興奮し、有効な心房収縮が失われた状態。12誘導ではP波の消失・f波・絶対性不整脈として捉える。最大の問題は心房内血栓による脳塞栓症で、抗凝固療法の適応評価が重要。',
    clinical: [
      '新規発症は12誘導記録のうえ医師へ報告、発症時刻の把握が治療方針に影響',
      'CHADS2/CHA2DS2-VAScなどで塞栓リスクを評価し抗凝固を確認',
      '頻脈性では血行動態を評価、脈拍欠損(触診とモニターHRの差)に注意',
    ],
  },
  {
    id: 'lad',
    name: '左軸偏位',
    nameEn: 'Left Axis Deviation',
    cat: 'axis',
    grade: '3級',
    hrText: '72 /分',
    axisText: '約 −45°(左軸偏位)',
    rhythm: { type: 'regular', rate: 72 },
    spec: { qrsAxis: -45, tAxis: -10, pAxis: 55 },
    highlight: ['I', 'II', 'III', 'aVF'],
    features: [
      'I は上向き(陽性)、II・III・aVF は下向き(陰性)',
      'いわゆる「I と aVF が離れていく」パターン',
      '左脚前枝ブロック・下壁梗塞・左室肥大などで生じる',
    ],
    description:
      '平均QRS電気軸が −30°より左に偏った状態。I誘導が陽性でII・aVFが陰性になるのが見分け方。左脚前枝ブロックが代表的原因で、それ自体より背景にある病態の評価が重要。',
    clinical: [
      'I陽性・aVF陰性なら左軸偏位—まず電極装着や体格要因も確認',
      '原因(左脚前枝ブロック・下壁梗塞・肥大など)の検索につなげる',
      '電気軸は系統的判読の必須ステップとして毎回確認する習慣を',
    ],
  },
  {
    id: 'rad',
    name: '右軸偏位',
    nameEn: 'Right Axis Deviation',
    cat: 'axis',
    grade: '3級',
    hrText: '74 /分',
    axisText: '約 +115°(右軸偏位)',
    rhythm: { type: 'regular', rate: 74 },
    spec: {
      qrsAxis: 115, tAxis: 80, pAxis: 75,
      precordRmul: [1.4, 1.1, 0.9, 0.8, 0.7, 0.7],
      precordSmul: [0.7, 0.9, 1.1, 1.2, 1.3, 1.3],
    },
    highlight: ['I', 'III', 'aVF'],
    features: [
      'I は下向き(陰性)、III・aVF は上向き(陽性)',
      'いわゆる「I と aVF が近づいてくる」パターン',
      '右室肥大・肺塞栓・左脚後枝ブロック・やせ型で生じる',
    ],
    description:
      '平均QRS電気軸が +90°より右に偏った状態。I誘導が陰性でIIIが陽性になる。右室肥大や肺性心、急性肺塞栓などの右心系負荷を示唆することがあり、背景の検索が大切。',
    clinical: [
      'I陰性・III陽性なら右軸偏位—若年やせ型では生理的なことも',
      '急性発症+呼吸困難なら肺塞栓(右心負荷)を念頭に置く',
      '右室肥大・慢性肺疾患などの背景を評価',
    ],
  },
]

export const caseById = (id: string): TwelveCase =>
  CASES.find((c) => c.id === id) ?? CASES[0]
