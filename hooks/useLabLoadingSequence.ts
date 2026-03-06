import { useState, useEffect, useRef } from 'react'

// ── Line pools ─────────────────────────────────────────────────────────────────

const LAB_PROCESS = [
  'Measuring creative compounds',
  'Mixing background chemicals',
  'Adjusting lighting formula',
  'Heating the idea flask',
  'Stirring pixels vigorously',
  'Synthesizing scene elements',
  'Combining texture compounds',
  'Calibrating composition chamber',
  'Injecting creativity serum',
  'Increasing contrast pressure',
  'Preparing visual reagents',
  'Aligning product atoms',
  'Running color reaction test',
  'Distilling the final concept',
]

const LAB_CHAOS = [
  'AI lab assistant knocked over a beaker',
  'Containing minor lab accident',
  'Something is bubbling aggressively',
  'The pixel mixture became unstable',
  'AI scientist pressed the wrong button',
  'Creativity levels exceeded safe limits',
  'This probably should not be glowing',
  'Emergency napkin deployment initiated',
  'The render escaped containment briefly',
  'Shaking the inspiration container carefully',
  'Lab coat is on fire but the vibe is immaculate',
  'Rogue pixel detected in the test tube',
  'AI intern ate the product sample',
  'Accidental explosion improved the composition',
  'The background chemicals have opinions now',
  'Containment protocol: strongly worded email',
  'Recalibrating after unexpected sneezing incident',
  'Someone left the creativity dial on maximum',
  'The formula is technically correct but suspicious',
  'Negotiating with the render to please finish',
]

const LAB_FINALIZING = [
  'Stabilizing final render',
  'Bottling final result',
  'Crystallizing the image',
  'Sealing the experiment',
  'Archiving lab results',
  'Storing formula in the vault',
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function pickRandom<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n)
}

function buildSequence(): string[] {
  const fixed = ['Product sample secured', 'Safety goggles on']
  const processCount = Math.random() < 0.5 ? 2 : 3
  const process = pickRandom(LAB_PROCESS, processCount)

  // 20% chance of a chaos line inserted randomly into the process steps
  const chaos = Math.random() < 0.20 ? pickRandom(LAB_CHAOS, 1) : []
  const finalizing = pickRandom(LAB_FINALIZING, 1)

  const middle = [...process]
  if (chaos.length) {
    const at = Math.floor(Math.random() * (middle.length + 1))
    middle.splice(at, 0, chaos[0])
  }

  return [...fixed, ...middle, ...finalizing]
}

// ── Types ──────────────────────────────────────────────────────────────────────

export type LabLineStatus = 'completed' | 'active' | 'hidden'

export interface LabLine {
  text: string
  status: LabLineStatus
}

// ── Hook ───────────────────────────────────────────────────────────────────────

/**
 * Returns a randomly assembled lab-experiment loading sequence.
 * Lines are revealed one at a time via `intervalMs` stagger.
 * The most recently revealed line is 'active'; previous lines are 'completed'.
 */
export function useLabLoadingSequence(active: boolean, intervalMs = 4000): LabLine[] {
  const [sequence, setSequence] = useState<string[]>([])
  const [visibleCount, setVisibleCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (active) {
      const seq = buildSequence()
      setSequence(seq)
      setVisibleCount(1)

      let count = 1
      timerRef.current = setInterval(() => {
        count++
        if (count > seq.length) {
          clearInterval(timerRef.current!)
          return
        }
        setVisibleCount(count)
      }, intervalMs)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      setVisibleCount(0)
      setSequence([])
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  return sequence.map((text, i) => ({
    text,
    status:
      i < visibleCount - 1 ? 'completed' :
      i === visibleCount - 1 ? 'active' :
      'hidden',
  }))
}
