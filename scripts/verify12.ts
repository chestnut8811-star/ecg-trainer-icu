/**
 * 12誘導合成モデルの臨床的妥当性を数値で検証する。
 * 各ケースで「診断のキー所見」が波形上に正しく現れているかをアサートする。
 */
import { createTwelve, type LeadId } from '../src/twelve/engine'
import { caseById } from '../src/twelve/cases'

/** R波頂点(=基準拍)付近で、指定相対時刻の電位を測る簡易プローブ */
function probe(id: string) {
  const def = caseById(id)
  const eng = createTwelve(def.spec, def.rhythm, 99)
  // 安定した1拍を取得(5秒付近のQRSを基準にする)
  const beats = eng.beatsBetween(3, 7)
  const R = beats[1] ?? beats[0]
  const at = (lead: LeadId, dt: number) => eng.sample(lead, R + dt)
  // QRSの代表振幅: R頂点付近の最大|値|に符号を付与
  const net = (lead: LeadId) => {
    let peak = 0
    for (let dt = -0.05; dt <= 0.06; dt += 0.004) {
      const v = at(lead, dt)
      if (Math.abs(v) > Math.abs(peak)) peak = v
    }
    return peak
  }
  // ST: J点後(+0.14s)の基線からの偏位
  const st = (lead: LeadId) => at(lead, 0.14) - at(lead, -0.12)
  return { net, st, at }
}

let pass = 0
let fail = 0
const check = (label: string, cond: boolean, detail = '') => {
  if (cond) {
    pass++
    console.log(`  ✓ ${label}`)
  } else {
    fail++
    console.log(`  ✗ ${label}  ${detail}`)
  }
}

console.log('● 正常')
{
  const { net, st } = probe('normal')
  check('II の QRS は陽性(R優位)', net('II') > 0.4)
  check('aVR の QRS は陰性', net('aVR') < -0.2)
  check('V1 は S 優位(rS)', net('V1') < 0)
  check('V6 は R 優位', net('V6') > 0.3)
  check('R波増高: V6 の R > V1 の R', net('V6') > Math.abs(net('V1')))
  check('ST はおおむね基線上(II)', Math.abs(st('II')) < 0.1)
}

console.log('● 急性下壁梗塞')
{
  const { st } = probe('inferior_mi')
  check('II の ST 上昇', st('II') > 0.15, `st=${st('II').toFixed(2)}`)
  check('III の ST 上昇', st('III') > 0.15, `st=${st('III').toFixed(2)}`)
  check('aVF の ST 上昇', st('aVF') > 0.15, `st=${st('aVF').toFixed(2)}`)
  check('I の対側性 ST 低下', st('I') < -0.05, `st=${st('I').toFixed(2)}`)
  check('aVL の対側性 ST 低下', st('aVL') < -0.05, `st=${st('aVL').toFixed(2)}`)
}

console.log('● 急性前壁中隔梗塞')
{
  const { st } = probe('anterior_mi')
  check('V2 の ST 上昇', st('V2') > 0.2, `st=${st('V2').toFixed(2)}`)
  check('V3 の ST 上昇', st('V3') > 0.2, `st=${st('V3').toFixed(2)}`)
  check('V4 の ST 上昇', st('V4') > 0.1, `st=${st('V4').toFixed(2)}`)
  check('側壁 I は上昇していない', st('I') < 0.1)
}

console.log('● 急性側壁梗塞')
{
  const { st } = probe('lateral_mi')
  check('I の ST 上昇', st('I') > 0.12, `st=${st('I').toFixed(2)}`)
  check('aVL の ST 上昇', st('aVL') > 0.12, `st=${st('aVL').toFixed(2)}`)
  check('V6 の ST 上昇', st('V6') > 0.1, `st=${st('V6').toFixed(2)}`)
}

console.log('● 急性心膜炎(びまん性ST上昇)')
{
  const { st } = probe('pericarditis')
  // 広範な誘導でST上昇(下壁・側壁・前胸部)
  const up = (['I', 'II', 'aVF', 'V3', 'V4', 'V5', 'V6'] as const).filter((l) => st(l) > 0.08)
  check('広範(6誘導以上)でST上昇=びまん性', up.length >= 6, `up=${up.length} (${up.join(',')})`)
  check('aVR は対側性にST低下', st('aVR') < -0.05, `st=${st('aVR').toFixed(2)}`)
  check('単一冠動脈支配に限局しない(下壁も前胸部も上昇)', st('II') > 0.08 && st('V4') > 0.08)
}

console.log('● 高カリウム血症(テント状T)')
{
  const { at } = probe('hyperk12')
  // T頂点(+0.32s)が高い & 幅が狭い(±0.06sで急減)= 尖鋭
  const tPeak = at('V3', 0.32)
  const tFlank = at('V3', 0.42)
  check('V3 のT波が増高(テント状)', tPeak > 0.7, `T=${tPeak.toFixed(2)}`)
  check('T波が尖鋭(幅が狭い)', tPeak > tFlank * 2.5, `peak=${tPeak.toFixed(2)} flank=${tFlank.toFixed(2)}`)
  // P波平低化: II誘導のP(-0.16s)が小さい
  check('II のP波が平低化', Math.abs(at('II', -0.16)) < 0.06, `P=${at('II', -0.16).toFixed(3)}`)
}

console.log('● 完全右脚ブロック')
{
  const { at } = probe('rbbb')
  // V1: QRS後期(幅広化でピークは+0.13s付近へ移動)に R’(陽性の遅延成分)
  let lateR = 0
  for (let dt = 0.08; dt <= 0.2; dt += 0.005) lateR = Math.max(lateR, at('V1', dt))
  check('V1 に後期R’(rSR’)', lateR > 0.3, `lateMax=${lateR.toFixed(2)}`)
  let lateS = 0
  for (let dt = 0.1; dt <= 0.22; dt += 0.005) lateS = Math.min(lateS, at('V6', dt))
  check('V6 に幅広い後期S', lateS < -0.1, `lateMin=${lateS.toFixed(2)}`)
}

console.log('● 完全左脚ブロック')
{
  const { net } = probe('lbbb')
  check('V1 は深い QS(陰性)', net('V1') < -0.4, `net=${net('V1').toFixed(2)}`)
  check('V6 は陽性の単峰性R', net('V6') > 0.3, `net=${net('V6').toFixed(2)}`)
}

console.log('● 左室肥大')
{
  const { net } = probe('lvh')
  const sv1 = Math.abs(net('V1'))
  const rv6 = net('V6')
  check('Sokolow-Lyon相当: SV1 + RV6 が高電位', sv1 + rv6 > 2.3, `sum=${(sv1 + rv6).toFixed(2)}`)
}

console.log('● 左軸偏位')
{
  const { net } = probe('lad')
  check('I は陽性', net('I') > 0.2, `net=${net('I').toFixed(2)}`)
  check('aVF は陰性', net('aVF') < -0.1, `net=${net('aVF').toFixed(2)}`)
  check('II は陰性傾向', net('II') < 0.1, `net=${net('II').toFixed(2)}`)
}

console.log('● 右軸偏位')
{
  const { net } = probe('rad')
  check('I は陰性', net('I') < -0.1, `net=${net('I').toFixed(2)}`)
  check('III は陽性', net('III') > 0.2, `net=${net('III').toFixed(2)}`)
  check('aVF は陽性', net('aVF') > 0.1, `net=${net('aVF').toFixed(2)}`)
}

console.log('● WPW症候群')
{
  const { at } = probe('wpw')
  // PR短縮+デルタ: QRS立ち上がり前(-0.05s)に既に有意な偏位
  check('デルタ波: QRS立ち上がり前に偏位あり', Math.abs(at('II', -0.05)) > 0.1, `pre=${at('II', -0.05).toFixed(2)}`)
}

console.log(`\n=== ${pass} passed / ${fail} failed ===`)
if (fail > 0) process.exit(1)
