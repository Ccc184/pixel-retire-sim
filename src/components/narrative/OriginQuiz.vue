<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '../../store/game.store.js'
import type { OriginChoices } from '../../types/global.d.js'

interface QuizOption {
  value: 0 | 1 | 2
  label: string
  hint: string
}

interface QuizQuestion {
  key: keyof OriginChoices
  title: string
  subtitle: string
  options: readonly [QuizOption, QuizOption, QuizOption]
}

const store = useGameStore()

const questions: readonly QuizQuestion[] = [
  {
    key: 'cityReason',
    title: '你为什么来到这座城市？',
    subtitle: '城市不问来处，但来处定义了你',
    options: [
      { value: 0, label: '追逐梦想', hint: '霓虹在瞳孔里燃烧成银河' },
      { value: 1, label: '被迫而来', hint: '被潮水推上了岸' },
      { value: 2, label: '家人/伴侣在此', hint: '循着某个人的足迹扎根' },
    ],
  },
  {
    key: 'careerMotivation',
    title: '驱动你选择职业的是什么？',
    subtitle: '答案会在每一个深夜回响',
    options: [
      { value: 0, label: '积累财富提前退休', hint: '把自由换算成数字' },
      { value: 1, label: '稳定体面', hint: '抱住那根名为安稳的浮木' },
      { value: 2, label: '做喜欢的事', hint: '把灵魂喂饱' },
    ],
  },
  {
    key: 'riskAttitude',
    title: '你对风险的态度是？',
    subtitle: '骰子已经在你手中',
    options: [
      { value: 0, label: '激进赌得起', hint: '把命运压缩进骰子的六个面' },
      { value: 1, label: '中庸平衡', hint: '走在不偏不倚的窄路上' },
      { value: 2, label: '稳健安全垫', hint: '风暴来临前挖好地下宫殿' },
    ],
  },
] as const

const currentStep = ref<number>(0)
const answers = ref<OriginChoices>({
  cityReason: 0,
  careerMotivation: 0,
  riskAttitude: 0,
})
const selectedValue = ref<0 | 1 | 2 | null>(null)

const progressPercent = computed(() => ((currentStep.value + 1) / questions.length) * 100)
const isLastQuestion = computed(() => currentStep.value === questions.length - 1)
const currentQuestion = computed<QuizQuestion>(() => questions[currentStep.value])
const canProceed = computed(() => selectedValue.value !== null)

function selectOption(value: 0 | 1 | 2): void {
  selectedValue.value = value
}

function nextQuestion(): void {
  if (selectedValue.value === null) return
  const key = currentQuestion.value.key
  answers.value[key] = selectedValue.value

  if (isLastQuestion.value) {
    store.startNewGame({ ...answers.value })
  } else {
    currentStep.value += 1
    selectedValue.value = null
  }
}
</script>

<template>
  <div class="quiz-screen">
    <!-- 背景扫描线 -->
    <div class="quiz-bg-scanlines" />
    <!-- 背景星光 -->
    <div class="quiz-bg-stars" />

    <div class="quiz-inner pixel-panel">
      <!-- 顶部霓虹标题 -->
      <div class="quiz-neon-title">
        <span class="title-deco">◢◤</span>
        <h1 class="quiz-main-title">ORIGIN QUIZ</h1>
        <span class="title-deco">◥◣</span>
      </div>
      <p class="quiz-neon-sub">定义你的像素宿命</p>

      <!-- 顶部进度区 -->
      <div class="quiz-header">
        <div class="quiz-step-indicator">
          <span class="step-current">{{ currentStep + 1 }}</span>
          <span class="step-slash">/</span>
          <span class="step-total">{{ questions.length }}</span>
        </div>
        <h2 class="quiz-question-title">{{ currentQuestion.title }}</h2>
        <p class="quiz-question-subtitle">{{ currentQuestion.subtitle }}</p>
        <div class="neon-progress-track quiz-progress">
          <div
            class="neon-progress-fill"
            :style="{ width: progressPercent + '%' }"
          ></div>
        </div>
      </div>

      <!-- 选项区 -->
      <div class="quiz-options">
        <div
          v-for="opt in currentQuestion.options"
          :key="opt.value"
          class="quiz-option neon-option"
          :class="{ selected: selectedValue === opt.value }"
          @click="selectOption(opt.value)"
        >
          <div class="option-marker" :class="{ selected: selectedValue === opt.value }">
            {{ ['A', 'B', 'C'][opt.value] }}
          </div>
          <div class="option-body">
            <div class="option-label">{{ opt.label }}</div>
            <div class="option-hint">{{ opt.hint }}</div>
          </div>
          <div v-if="selectedValue === opt.value" class="option-select-indicator">
            <span class="indicator-dot" />
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="quiz-footer">
        <button
          class="btn-next neon-btn"
          :class="{ disabled: !canProceed }"
          :disabled="!canProceed"
          @click="nextQuestion"
        >
          <span class="btn-scan" />
          {{ isLastQuestion ? '确认宿命，进入设置 →' : '下一步 →' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quiz-screen {
  position: fixed;
  inset: 0;
  background: var(--bg-deep);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  overflow-y: auto;
}

/* 背景扫描线 */
.quiz-bg-scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 2px,
    rgba(0, 212, 255, 0.02) 2px,
    rgba(0, 212, 255, 0.02) 4px
  );
  z-index: 0;
}

.quiz-bg-stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(1px 1px at 20% 30%, #fff, transparent),
    radial-gradient(1px 1px at 60% 70%, #00d4ff, transparent),
    radial-gradient(1px 1px at 80% 20%, #ff2d95, transparent),
    radial-gradient(1px 1px at 30% 80%, #fff, transparent),
    radial-gradient(2px 2px at 70% 40%, #c900ff40, transparent);
}

.quiz-inner {
  position: relative;
  z-index: 1;
  width: min(720px, 92vw);
  padding: 36px 32px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* 顶部霓虹标题 */
.quiz-neon-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.quiz-main-title {
  font-size: 28px;
  color: #00d4ff;
  margin: 0;
  letter-spacing: 4px;
  font-weight: bold;
  font-family: 'DotGothic16', monospace;
  text-shadow:
    0 0 6px #00d4ff,
    0 0 14px #00d4ff,
    0 0 28px #00d4ff,
    0 0 50px #00d4ff60;
  animation: quizTitleGlow 3s ease-in-out infinite;
}

@keyframes quizTitleGlow {
  0%, 100% {
    text-shadow: 0 0 6px #00d4ff, 0 0 14px #00d4ff, 0 0 28px #00d4ff, 0 0 50px #00d4ff60;
  }
  50% {
    text-shadow: 0 0 8px #00d4ff, 0 0 20px #00d4ff, 0 0 36px #c900ff80, 0 0 60px #00d4ff40;
  }
}

.title-deco {
  color: #c900ff;
  font-size: 14px;
  text-shadow: 0 0 8px #c900ff;
}

.quiz-neon-sub {
  text-align: center;
  color: #c900ff;
  margin: -16px 0 0;
  letter-spacing: 3px;
  font-size: 12px;
  text-shadow: 0 0 6px #c900ff;
  font-family: 'DotGothic16', monospace;
}

.quiz-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quiz-step-indicator {
  font-size: 18px;
  color: #94b0c2;
  letter-spacing: 2px;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.step-current {
  color: #00d4ff;
  font-size: 32px;
  font-weight: bold;
  text-shadow: 0 0 8px #00d4ff, 0 0 16px #00d4ff80;
}

.step-slash {
  margin: 0 4px;
  color: #c900ff80;
  font-size: 20px;
}

.step-total {
  color: #94b0c2;
  font-size: 20px;
}

.quiz-question-title {
  font-size: 24px;
  color: #00d4ff;
  margin: 8px 0 0;
  letter-spacing: 2px;
  text-shadow: 0 0 6px #00d4ff, 0 0 14px #00d4ff60;
  font-family: 'DotGothic16', monospace;
}

.quiz-question-subtitle {
  margin: 0;
  color: #c2c3c7;
  font-size: 13px;
  letter-spacing: 1px;
  font-style: italic;
  opacity: 0.8;
}

.quiz-progress {
  margin-top: 8px;
}

/* 霓虹进度条 */
.neon-progress-track {
  width: 100%;
  height: 12px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid #00d4ff60;
  box-shadow: inset 0 0 6px #00d4ff20, 0 0 4px #00d4ff30;
  padding: 2px;
}

.neon-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00d4ff 0%, #c900ff 100%);
  box-shadow: 0 0 8px #00d4ff, 0 0 16px #c900ff80;
  transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.quiz-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 霓虹选项按钮 */
.neon-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(10, 5, 30, 0.6);
  border: 2px solid #00d4ff60;
  box-shadow:
    0 0 4px #00d4ff20,
    inset 0 0 8px #00d4ff10;
  cursor: pointer;
  transition: all 0.15s ease;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  position: relative;
  overflow: hidden;
}

.neon-option:hover {
  border-color: #ff8800;
  background: rgba(255, 136, 0, 0.08);
  box-shadow:
    0 0 8px #ff8800,
    0 0 18px #ff880040,
    inset 0 0 10px #ff880015;
  transform: translateX(4px);
}

.neon-option.selected {
  border-color: #ff2d95;
  background: rgba(255, 45, 149, 0.12);
  box-shadow:
    0 0 10px #ff2d95,
    0 0 22px #ff2d9560,
    0 0 40px #c900ff30,
    inset 0 0 14px #ff2d9520;
}

.neon-option.selected:hover {
  border-color: #ff2d95;
  transform: translateX(4px);
  box-shadow:
    0 0 12px #ff2d95,
    0 0 26px #ff2d9580,
    inset 0 0 16px #ff2d9525;
}

/* 扫描线 */
.neon-option::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 3px,
    rgba(255, 255, 255, 0.02) 3px,
    rgba(255, 255, 255, 0.02) 4px
  );
}

.option-marker {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  color: #00d4ff;
  font-size: 20px;
  font-weight: bold;
  border: 2px solid #00d4ff80;
  text-shadow: 0 0 6px #00d4ff;
  box-shadow: 0 0 6px #00d4ff40;
  transition: all 0.15s ease;
  font-family: 'DotGothic16', monospace;
  z-index: 1;
}

.option-marker.selected {
  background: #ff2d95;
  color: #fff;
  border-color: #ff2d95;
  text-shadow: 0 0 4px #fff;
  box-shadow: 0 0 10px #ff2d95, 0 0 20px #ff2d9580;
}

.option-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
  flex: 1;
  z-index: 1;
}

.option-label {
  font-size: 18px;
  letter-spacing: 1px;
  color: #f4f4f4;
  text-shadow: 0 0 4px rgba(255,255,255,0.2);
  font-family: 'DotGothic16', monospace;
  font-weight: bold;
}

.neon-option.selected .option-label {
  color: #fff;
  text-shadow: 0 0 8px #ff2d95, 0 0 4px #fff;
}

.option-hint {
  font-size: 12px;
  color: #94b0c2;
  letter-spacing: 0.5px;
  font-style: italic;
}

.neon-option.selected .option-hint {
  color: #ffccdd;
  text-shadow: 0 0 4px #ff2d9560;
}

/* 选中指示器 */
.option-select-indicator {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.indicator-dot {
  width: 12px;
  height: 12px;
  background: #ff2d95;
  border-radius: 50%;
  box-shadow:
    0 0 6px #ff2d95,
    0 0 14px #ff2d95,
    0 0 20px #ff2d9580;
  animation: dotPulse 1.2s ease-in-out infinite;
}

@keyframes dotPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}

.quiz-footer {
  display: flex;
  justify-content: flex-end;
}

/* 霓虹按钮 */
.neon-btn {
  position: relative;
  font-size: 16px;
  padding: 14px 32px;
  background: rgba(0, 212, 255, 0.1);
  color: #00d4ff;
  border: 2px solid #00d4ff;
  box-shadow:
    0 0 8px #00d4ff,
    0 0 20px #00d4ff40,
    inset 0 0 12px #00d4ff20;
  letter-spacing: 2px;
  font-family: 'DotGothic16', monospace;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.15s ease;
  text-shadow: 0 0 6px #00d4ff;
  overflow: hidden;
}

.btn-scan {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 3px,
    rgba(255,255,255,0.03) 3px,
    rgba(255,255,255,0.03) 4px
  );
  pointer-events: none;
}

.neon-btn:hover:not(:disabled):not(.disabled) {
  background: rgba(255, 45, 149, 0.15);
  color: #ff2d95;
  border-color: #ff2d95;
  box-shadow:
    0 0 12px #ff2d95,
    0 0 28px #ff2d9580,
    0 0 50px #c900ff40,
    inset 0 0 16px #ff2d9525;
  text-shadow: 0 0 8px #ff2d95, 0 0 16px #ff2d95;
  transform: translateY(-2px);
}

.neon-btn:active:not(:disabled):not(.disabled) {
  transform: translateY(2px);
}

.neon-btn.disabled,
.neon-btn:disabled {
  background: rgba(50, 50, 70, 0.4);
  color: #566c86;
  border-color: #333c57;
  cursor: not-allowed;
  box-shadow: none;
  text-shadow: none;
  opacity: 0.5;
}
</style>
