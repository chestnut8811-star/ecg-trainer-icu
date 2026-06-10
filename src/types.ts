/** 波形カテゴリ */
export type CategoryId =
  | 'basic'
  | 'ectopic'
  | 'svt'
  | 'block'
  | 'lethal'
  | 'other'

/** 緊急度 */
export type Danger = 'normal' | 'watch' | 'caution' | 'critical'

/** 波形形状の調整パラメータ(1拍分・R波頂点を時刻0とした相対値) */
export interface ShapeMod {
  /** P波振幅(mV)。0でP波なし */
  pAmp?: number
  pSigma?: number
  /** P波中心からR波頂点までの距離(秒) ≒ PQ時間 */
  pr?: number
  rAmp?: number
  /** QRS幅の倍率(1=正常) */
  widthScale?: number
  /** ST部分のドーム状上昇(mV) */
  stDome?: number
  tAmp?: number
  tSigma?: number
  tMu?: number
}

/** リズム生成設定 */
export type GenConfig =
  | {
      kind: 'sinus'
      rate: number
      shape?: ShapeMod
      ectopy?: { type: 'pac' | 'pvc'; min: number; max: number }
      jitter?: number
    }
  | { kind: 'af'; rrMin: number; rrMax: number }
  | { kind: 'flutter' }
  | { kind: 'wenckebach' }
  | { kind: 'mobitz2' }
  | { kind: 'avb3' }
  | { kind: 'pause'; rate: number }
  | { kind: 'vt'; rate: number }
  | { kind: 'tdp' }
  | { kind: 'vf' }
  | { kind: 'asystole' }
  | { kind: 'paced'; rate: number }
  | { kind: 'artifact'; rate: number }

/** 波形1種類の定義(臨床情報+生成設定) */
export interface WaveformDef {
  id: string
  /** 日本語名 */
  name: string
  /** 英語名 */
  nameEn: string
  /** モニター表示用略語 */
  abbr: string
  category: CategoryId
  danger: Danger
  /** 表示用心拍数レンジ */
  hr: string
  /** リズムの整・不整 */
  rhythm: string
  /** 判読のキーポイント */
  keyFeatures: string[]
  /** 簡易説明 */
  description: string
  /** 看護のポイント */
  nursingPoints: string[]
  /** 発見時の初期対応(クイズ「対応モード」の正答) */
  firstAction: string
  /** 緊急時アラーム表示文字列 */
  alarmLabel?: string
  gen: GenConfig
}
