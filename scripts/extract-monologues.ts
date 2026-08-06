// 提取 retirement-paths.ts 中所有路径的独白清单
import { readFileSync } from 'node:fs'

const src = readFileSync('src/data/retirement-paths.ts', 'utf-8')

const anchors = [
  { id: 'aiSymbiote', name: 'AI共生者' },
  { id: 'chainNative', name: '链上原住民' },
  { id: 'digitalNomad', name: '数字游牧民' },
  { id: 'superIP', name: '超级IP' },
  { id: 'silverEconomy', name: '银发收割者' },
  { id: 'bioGambler', name: '生物赌徒' },
]

function extractSection(block: string, key: string): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  const match = block.match(new RegExp(key + ': *\\[([\\s\\S]*?)\\n  \\],'))
  if (match) {
    // 用 ageRange 分组，texts 数组内每行一条（去掉引号和逗号）
    const groups = match[1].split(/\n\s*\{\s*ageRange: \[(\d+), (\d+)\],\s*texts: \[/).slice(1)
    // groups: [a1,a2,texts1, b1,b2,texts2, ...]
    for (let i = 0; i + 2 < groups.length; i += 3) {
      const lo = groups[i], hi = groups[i + 1], body = groups[i + 2]
      const texts = (body.match(/'([^']*)'/g) || []).map(s => s.replace(/^'|'$/g, ''))
      result[`${lo}-${hi}`] = texts
    }
  }
  return result
}

let grandTotal = 0
for (let i = 0; i < anchors.length; i++) {
  const a = anchors[i]
  const start = src.indexOf(`const ${a.id}: RetirementPath`)
  const end = i + 1 < anchors.length ? src.indexOf(`const ${anchors[i + 1].id}: RetirementPath`) : src.length
  const block = src.slice(start, end)
  console.error(`DEBUG ${a.name}: start=${start} end=${end} len=${block.length}`)

  const opening = extractSection(block, 'openingMonologues')
  const side = extractSection(block, 'sideHustleMonologues')

  const openingCount = Object.values(opening).reduce((s, t) => s + t.length, 0)
  const sideCount = Object.values(side).reduce((s, t) => s + t.length, 0)
  grandTotal += openingCount + sideCount

  console.log(`\n========== ${a.name} ==========`)
  console.log(`【正式独白 openingMonologues】共 ${openingCount} 条 / ${Object.keys(opening).length} 组`)
  for (const [range, texts] of Object.entries(opening)) {
    console.log(`\n[${range}岁] ${texts.length}条:`)
    texts.forEach(t => console.log(`  · ${t}`))
  }
  if (Object.keys(side).length > 0) {
    console.log(`\n【副业独白 sideHustleMonologues】共 ${sideCount} 条 / ${Object.keys(side).length} 组 ← All In前使用`)
    for (const [range, texts] of Object.entries(side)) {
      console.log(`\n[${range}岁] ${texts.length}条:`)
      texts.forEach(t => console.log(`  · ${t}`))
    }
  } else {
    console.log('\n【副业独白】无定义（All In前回退用正式独白）')
  }
}
console.log(`\n========== 各路径独白总计: ${grandTotal} 条 ==========`)