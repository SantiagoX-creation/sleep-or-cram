import { useState } from 'react';
import { Brain, Moon, BookOpen, TrendingUp, Clock, AlertCircle } from 'lucide-react';

interface Result {
  decision: 'sleep' | 'strategic-cram';
  reasoning: string;
  projectedBoost: number;
  actionPlan: string[];
  scienceNote: string;
  availableHours: number;
  effectiveStudyHours: number;
  cognitiveState: number;
  adjustedConfidence: number;
  boostS1: number;
  boostS2: number;
  sleepBenefitS1: number;
  cramBenefitS2: number;
  sleepBenefitS2: number;
}

export default function SleepOrCram() {
  const [step, setStep] = useState('input');
  const [examTime, setExamTime] = useState('09:00');
  const [currentTime, setCurrentTime] = useState('22:00');
  const [confidence, setConfidence] = useState(50);
  const [hoursStudied, setHoursStudied] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({ q1: 0, q2: 0, q3: 0 });
  const [result, setResult] = useState<Result | null>(null);

  const calculateRecommendation = () => {
    // Blend objective quiz score with subjective confidence
    const finalConfidence = Math.round(
      (0.7 * (quizAnswers.q1 + quizAnswers.q2 + quizAnswers.q3)) + // 70% weight for objective quiz
      (0.3 * confidence) // 30% weight for user's subjective slider input
    );
    
    const now = parseTime(currentTime);
    const exam = parseTime(examTime);
    
    let availableHours = exam - now;
    if (availableHours < 0) availableHours += 24;
    
    const minSleepNeeded = 6;
    const optimalSleep = 8;
    const maxProductiveStudy = 3;
    
    // --- A. Define Scientific Constants & Factors ---
    // 1. Cognitive State Factor (Encoding Efficiency)
    const isLateNight = now >= 22 || now <= 4;
    // Fatigue Factor: Drops sharply after 2.5 hours of focused work
    const fatigueFactor = hoursStudied >= 4 ? 0.4 : hoursStudied >= 2.5 ? 0.6 : 1.0;
    // Time Factor: Late-night encoding is significantly less effective
    const timeFactor = isLateNight ? 0.5 : 1.0;
    const cognitiveStateFactor = fatigueFactor * timeFactor;
    
    // 2. Confidence Adjustments (Impact on Cramming Effectiveness) - NOW USING FINAL CONFIDENCE
    const highConfidence = finalConfidence >= 75;
    const lowConfidence = finalConfidence <= 35;
    
    // Base Cramming Benefit (High initial retention, then diminishing returns)
    const getCramBenefit = (hours: number) => {
      let base = 0;
      if (hours >= 1) base += 20; // 1st hour is 20 points
      if (hours >= 2) base += 12; // 2nd hour is 12 points
      if (hours >= 3) base += 8;  // 3rd hour is 8 points
      
      // Apply time and fatigue penalties
      base *= cognitiveStateFactor;
      // Apply confidence multiplier
      if (lowConfidence) {
        base *= 1.25; // Low confidence means high potential gain from new knowledge
      } else if (highConfidence) {
        base *= 0.75; // High confidence means low potential gain from new knowledge
      }
      return base;
    };
    
    // 3. Sleep Benefit/Penalty (Consolidation Efficiency)
    const getSleepBenefit = (sleepHours: number) => {
      if (sleepHours >= optimalSleep) return 25;
      if (sleepHours >= minSleepNeeded) return 15;
      if (sleepHours >= 4) return 5;
      if (sleepHours > 0) return -25; // Acute sleep deprivation (0-4 hours)
      return -40; // No sleep (0 hours) - catastrophic cognitive impact
    };
    
    // --- B. Scenario Testing (The Scientific Trade-Off) ---
    
    // Scenario 1: Max Sleep (Minimal Review)
    // Assume 1 hour for preparation/review/wake-up
    const sleepHoursS1 = Math.max(0, availableHours - 1);
    const boostS1 = getSleepBenefit(sleepHoursS1);
    
    // Scenario 2: Strategic Split (Study Now + Sleep)
    // The available time for productive study, ensuring minimum sleep is still possible
    const studyHoursS2 = Math.min(
      maxProductiveStudy,
      Math.max(0, availableHours - minSleepNeeded - 1)
    );
    const sleepHoursS2 = Math.max(0, availableHours - studyHoursS2 - 1);
    
    const cramBenefitS2 = getCramBenefit(studyHoursS2);
    const sleepBenefitS2 = getSleepBenefit(sleepHoursS2);
    const boostS2 = cramBenefitS2 + sleepBenefitS2;
    
    // --- C. Final Decision Logic ---
    let decision: 'sleep' | 'strategic-cram';
    let reasoning: string;
    let projectedBoost: number;
    let actionPlan: string[];
    let scienceNote: string;
    
    if (availableHours < 5 || (boostS1 > boostS2 && sleepHoursS1 >= 6)) {
      // SCENARIO 1 WIN: Either too little time, or the Max Sleep plan is mathematically better AND provides adequate sleep.
      decision = 'sleep';
      projectedBoost = Math.max(0, boostS1);
      
      if (availableHours < 5) {
        reasoning = 'You have very limited time. Sleep deprivation will hurt you more than cramming will help.';
        actionPlan = [
          'Go to sleep right now.',
          'Focus on getting maximum rest.',
          'Quick review of key formulas/concepts when you wake up.'
        ];
        scienceNote = 'With less than 5 hours, your brain needs rest more than new information. Sleep consolidates what you already know.';
      } else {
        reasoning = 'Maximizing sleep yields the highest projected score boost. Your knowledge is best consolidated now.';
        actionPlan = [
          `Sleep ${Math.floor(sleepHoursS1)} hours minimum.`,
          'Limit screen time 30 mins before bed.',
          'Light, focused review in the morning.'
        ];
        scienceNote = `The consolidation benefit of ${Math.floor(sleepHoursS1)} hours of sleep (Boost: +${Math.round(getSleepBenefit(sleepHoursS1))}%) outweighs the minimal gain from more studying.`;
      }
    } else {
      // SCENARIO 2 WIN: Strategic Split is mathematically better.
      decision = 'strategic-cram';
      projectedBoost = Math.max(0, boostS2);
      const finalStudy = Math.floor(studyHoursS2 * 10) / 10;
      const finalSleep = Math.floor(sleepHoursS2 * 10) / 10;
      reasoning = 'The Strategic Split maximizes your net gain by balancing crucial rest and targeted study.';
      actionPlan = [
        `Study for ${finalStudy} hours. Focus ONLY on high-value/low-confidence topics.`,
        'Use active recall (practice problems, flashcards), not just reading.',
        `Sleep ${finalSleep} hours minimum.`,
        'Wake up early for quick review and proper breakfast.'
      ];
      scienceNote = `Your current cognitive state is at ${Math.round(cognitiveStateFactor * 100)}%. Focused encoding now (Boost: +${Math.round(cramBenefitS2)}%) combined with consolidation (Boost: +${Math.round(sleepBenefitS2)}%) provides the optimal strategy.`;
    }
    
    // Set result object with detailed metrics
    setResult({
      decision,
      reasoning,
      projectedBoost: Math.round(projectedBoost),
      actionPlan,
      scienceNote,
      availableHours: Math.floor(availableHours * 10) / 10,
      effectiveStudyHours: Math.floor((decision === 'strategic-cram' ? studyHoursS2 : 0) * 10) / 10,
      cognitiveState: Math.round(cognitiveStateFactor * 100),
      adjustedConfidence: finalConfidence,
      boostS1: Math.round(boostS1), // Max Sleep scenario
      boostS2: Math.round(boostS2), // Strategic Split scenario
      sleepBenefitS1: Math.round(getSleepBenefit(sleepHoursS1)),
      cramBenefitS2: Math.round(cramBenefitS2),
      sleepBenefitS2: Math.round(sleepBenefitS2)
    });
    
    setStep('result');
  };

  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + minutes / 60;
  };

  const resetApp = () => {
    setStep('input');
    setQuizAnswers({ q1: 0, q2: 0, q3: 0 });
    setResult(null);
  };

  const getDecisionColor = (decision: 'sleep' | 'strategic-cram') => {
    if (decision === 'sleep') return 'bg-gradient-to-br from-teal-600 to-emerald-700';
    if (decision === 'strategic-cram') return 'bg-gradient-to-br from-blue-600 to-cyan-700';
    return 'bg-gradient-to-br from-blue-500 to-blue-700';
  };

  const getDecisionIcon = (decision: 'sleep' | 'strategic-cram') => {
    if (decision === 'sleep') return <Moon className="w-12 h-12" />;
    if (decision === 'strategic-cram') return <Brain className="w-12 h-12" />;
    return <BookOpen className="w-12 h-12" />;
  };

  const getDecisionTitle = (decision: 'sleep' | 'strategic-cram') => {
    if (decision === 'sleep') return 'Sleep Now';
    if (decision === 'strategic-cram') return 'Strategic Study + Sleep';
    return 'Cram Time';
  };

  if (step === 'quiz') {
    const handleQuizSubmit = () => {
      calculateRecommendation();
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-700 p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <Brain className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-teal-600 bg-clip-text text-transparent mb-2">
              Confidence Check
            </h2>
            <p className="text-slate-600">
              Answer these questions honestly to calibrate your true readiness
            </p>
          </div>

          <div className="space-y-8">
            {/* Question 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
              <h3 className="font-bold text-lg text-slate-800 mb-4">
                1. If someone asked you to explain the core concept right now, you would:
              </h3>
              <div className="space-y-3">
                {[
                  { value: 0, label: 'Struggle significantly or freeze up', color: 'from-teal-400 to-cyan-500' },
                  { value: 33, label: 'Give a vague or incomplete explanation', color: 'from-teal-500 to-emerald-500' },
                  { value: 67, label: 'Explain it reasonably well with minor gaps', color: 'from-emerald-500 to-teal-600' },
                  { value: 100, label: 'Confidently explain it clearly and accurately', color: 'from-emerald-600 to-green-700' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setQuizAnswers({ ...quizAnswers, q1: option.value })}
                    className={`w-full p-4 rounded-lg text-left transition-all transform hover:scale-102 ${
                      quizAnswers.q1 === option.value
                        ? `bg-gradient-to-r ${option.color} text-white shadow-lg scale-102 border-2 border-white`
                        : 'bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 border-2 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option.label}</span>
                      {quizAnswers.q1 === option.value && (
                        <span className="text-xl">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Question 2 */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-6 border border-teal-200">
              <h3 className="font-bold text-lg text-slate-800 mb-4">
                2. Without looking at your notes, how much of the material can you actively recall?
              </h3>
              <div className="space-y-3">
                {[
                  { value: 0, label: 'Less than 25% - mostly blanks', color: 'from-teal-400 to-cyan-500' },
                  { value: 33, label: 'About 25-50% - recognize but can\'t reproduce', color: 'from-teal-500 to-emerald-500' },
                  { value: 67, label: 'About 50-75% - can recall main points', color: 'from-emerald-500 to-teal-600' },
                  { value: 100, label: 'Over 75% - can recall details confidently', color: 'from-emerald-600 to-green-700' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setQuizAnswers({ ...quizAnswers, q2: option.value })}
                    className={`w-full p-4 rounded-lg text-left transition-all transform hover:scale-102 ${
                      quizAnswers.q2 === option.value
                        ? `bg-gradient-to-r ${option.color} text-white shadow-lg scale-102 border-2 border-white`
                        : 'bg-white hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 border-2 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option.label}</span>
                      {quizAnswers.q2 === option.value && (
                        <span className="text-xl">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Question 3 */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-200">
              <h3 className="font-bold text-lg text-slate-800 mb-4">
                3. If you had to solve a practice problem similar to the exam right now:
              </h3>
              <div className="space-y-3">
                {[
                  { value: 0, label: 'Wouldn\'t know where to start', color: 'from-teal-400 to-cyan-500' },
                  { value: 33, label: 'Could start but would get stuck quickly', color: 'from-teal-500 to-emerald-500' },
                  { value: 67, label: 'Could work through it with some effort', color: 'from-emerald-500 to-teal-600' },
                  { value: 100, label: 'Could solve it smoothly and quickly', color: 'from-emerald-600 to-green-700' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setQuizAnswers({ ...quizAnswers, q3: option.value })}
                    className={`w-full p-4 rounded-lg text-left transition-all transform hover:scale-102 ${
                      quizAnswers.q3 === option.value
                        ? `bg-gradient-to-r ${option.color} text-white shadow-lg scale-102 border-2 border-white`
                        : 'bg-white hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 border-2 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option.label}</span>
                      {quizAnswers.q3 === option.value && (
                        <span className="text-xl">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={() => setStep('input')}
              className="flex-1 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 py-4 rounded-lg font-bold hover:from-slate-200 hover:to-slate-300 transition-all border border-slate-300"
            >
              ← Back
            </button>
            <button
              onClick={handleQuizSubmit}
              disabled={quizAnswers.q1 === 0 && quizAnswers.q2 === 0 && quizAnswers.q3 === 0}
              className={`flex-1 py-4 rounded-lg font-bold transition-all transform ${
                quizAnswers.q1 === 0 && quizAnswers.q2 === 0 && quizAnswers.q3 === 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-teal-600 text-white hover:from-blue-700 hover:to-teal-700 hover:scale-105 shadow-lg'
              }`}
            >
              Get My Recommendation →
            </button>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700">
                <strong className="text-blue-700">Why these questions?</strong> Research shows that self-assessed 
                confidence is often inaccurate. These questions measure your actual readiness through 
                recall and application ability.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'result' && result) {
    return (
      <div className={`min-h-screen ${getDecisionColor(result.decision)} p-6 flex items-center justify-center`}>
        <div className="max-w-2xl w-full">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mb-6">
            {/* Decision Header */}
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${
                result.decision === 'sleep' 
                  ? 'bg-gradient-to-br from-teal-100 to-emerald-100' 
                  : 'bg-gradient-to-br from-blue-100 to-cyan-100'
              } mb-4`}>
                <div className={result.decision === 'sleep' ? 'text-emerald-700' : 'text-blue-700'}>
                  {getDecisionIcon(result.decision)}
                </div>
              </div>
              <h2 className={`text-4xl font-bold mb-2 bg-gradient-to-r ${
                result.decision === 'sleep' 
                  ? 'from-teal-700 to-emerald-700' 
                  : 'from-blue-700 to-cyan-700'
              } bg-clip-text text-transparent`}>
                {getDecisionTitle(result.decision)}
              </h2>
              <p className="text-slate-700 text-lg">{result.reasoning}</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 text-center border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">{result.availableHours}h</div>
                <div className="text-xs text-slate-600 mt-1">Available Time</div>
              </div>
              <div className={`rounded-lg p-4 text-center border ${
                result.decision === 'sleep'
                  ? 'bg-gradient-to-br from-teal-50 to-emerald-50 border-emerald-200'
                  : 'bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200'
              }`}>
                <div className={`text-2xl font-bold ${
                  result.decision === 'sleep' ? 'text-emerald-700' : 'text-cyan-700'
                }`}>
                  +{result.projectedBoost}%
                </div>
                <div className="text-xs text-slate-600 mt-1">Projected Boost</div>
              </div>
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-lg p-4 text-center border border-teal-200">
                <div className="text-2xl font-bold text-teal-700">{result.cognitiveState}%</div>
                <div className="text-xs text-slate-600 mt-1">Cognitive State</div>
              </div>
            </div>

            {/* Action Plan */}
            <div className={`rounded-xl p-6 mb-6 ${
              result.decision === 'sleep'
                ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200'
                : 'bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200'
            }`}>
              <h3 className={`font-bold text-xl mb-4 ${
                result.decision === 'sleep' ? 'text-emerald-800' : 'text-blue-800'
              }`}>
                Your Action Plan
              </h3>
              <ol className="space-y-3">
                {result.actionPlan.map((step: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                      result.decision === 'sleep'
                        ? 'bg-gradient-to-br from-emerald-600 to-teal-600'
                        : 'bg-gradient-to-br from-blue-600 to-cyan-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-slate-700 pt-0.5 flex-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Science Note */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 mb-6 border border-cyan-200">
              <div className="flex items-start gap-3">
                <Brain className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-blue-800 mb-2">The Science Behind This Decision</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{result.scienceNote}</p>
                </div>
              </div>
            </div>

            {/* Decision Analysis Box */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 mb-6 border border-slate-200">
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-slate-800">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Decision Analysis
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                We compared both strategies mathematically. Here's why we chose this plan:
              </p>
              <div className="grid grid-cols-2 gap-4">
                {/* Chosen Plan */}
                <div className={`rounded-lg p-4 ${
                  result.decision === 'sleep' 
                    ? 'bg-gradient-to-br from-emerald-100 to-teal-100 border-2 border-emerald-400' 
                    : 'bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-400'
                }`}>
                  <div className={`text-xs font-bold uppercase mb-2 ${
                    result.decision === 'sleep' ? 'text-emerald-700' : 'text-blue-700'
                  }`}>
                    ✓ Chosen Plan
                  </div>
                  <div className={`font-bold text-lg mb-3 ${
                    result.decision === 'sleep' ? 'text-emerald-900' : 'text-blue-900'
                  }`}>
                    {result.decision === 'sleep' ? 'Max Sleep' : 'Strategic Study'}
                  </div>
                  <div className="space-y-2 text-sm text-slate-700">
                    <div className="flex justify-between">
                      <span>Total Boost:</span>
                      <span className="font-bold">{result.decision === 'sleep' ? `+${result.boostS1}%` : `+${result.boostS2}%`}</span>
                    </div>
                    {result.decision === 'sleep' ? (
                      <div className="flex justify-between opacity-80">
                        <span>Sleep Benefit:</span>
                        <span>+{result.sleepBenefitS1}%</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between opacity-80">
                          <span>Study Benefit:</span>
                          <span>+{result.cramBenefitS2}%</span>
                        </div>
                        <div className="flex justify-between opacity-80">
                          <span>Sleep Benefit:</span>
                          <span>+{result.sleepBenefitS2}%</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Alternative Plan */}
                <div className="bg-gradient-to-br from-slate-100 to-slate-50 border-2 border-slate-300 rounded-lg p-4">
                  <div className="text-xs font-bold uppercase mb-2 text-slate-500">
                    Alternative
                  </div>
                  <div className="font-bold text-lg mb-3 text-slate-700">
                    {result.decision === 'sleep' ? 'Strategic Study' : 'Max Sleep'}
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Total Boost:</span>
                      <span className="font-bold">{result.decision === 'sleep' ? `+${result.boostS2}%` : `+${result.boostS1}%`}</span>
                    </div>
                    {result.decision === 'sleep' ? (
                      <>
                        <div className="flex justify-between opacity-70">
                          <span>Study Benefit:</span>
                          <span>+{result.cramBenefitS2}%</span>
                        </div>
                        <div className="flex justify-between opacity-70">
                          <span>Sleep Benefit:</span>
                          <span>+{result.sleepBenefitS2}%</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between opacity-70">
                        <span>Sleep Benefit:</span>
                        <span>+{result.sleepBenefitS1}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-xs text-slate-600">
                The chosen plan provides a <strong className="text-slate-800">{Math.abs(result.boostS1 - result.boostS2)}% higher</strong> projected score boost based on your cognitive state, time available, and true readiness level.
              </div>
            </div>

            <button
              onClick={resetApp}
              className="w-full bg-gradient-to-r from-slate-700 to-slate-800 text-white py-3 rounded-lg font-bold hover:from-slate-800 hover:to-slate-900 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              New Decision
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-700 p-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center gap-4 mb-4">
            <Moon className="w-10 h-10 text-teal-600" />
            <div className="text-2xl font-bold text-slate-400">or</div>
            <BookOpen className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-teal-600 bg-clip-text text-transparent mb-2">
            Sleep or Cram?
          </h1>
          <p className="text-slate-600">Science-backed decision tool for students</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Current Time
            </label>
            <input
              type="time"
              value={currentTime}
              onChange={(e) => setCurrentTime(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Exam Time (Tomorrow)
            </label>
            <input
              type="time"
              value={examTime}
              onChange={(e) => setExamTime(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Hours Studied Today
            </label>
            <input
              type="number"
              value={hoursStudied}
              onChange={(e) => setHoursStudied(Math.max(0, parseInt(e.target.value) || 0))}
              min="0"
              max="12"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Confidence Level: {confidence}%
            </label>
            <input
              type="range"
              value={confidence}
              onChange={(e) => setConfidence(parseInt(e.target.value))}
              min="0"
              max="100"
              className="w-full h-2 bg-gradient-to-r from-blue-200 via-cyan-200 to-teal-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-blue-600 [&::-webkit-slider-thumb]:to-teal-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gradient-to-r [&::-moz-range-thumb]:from-blue-600 [&::-moz-range-thumb]:to-teal-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Lost</span>
              <span>Somewhat ready</span>
              <span>Very confident</span>
            </div>
          </div>

          <button
            onClick={() => setStep('quiz')}
            className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-4 rounded-lg font-bold hover:from-blue-700 hover:to-teal-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Continue to Confidence Check
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          <Clock className="w-4 h-4 inline mr-1 text-blue-600" />
          Based on sleep science & cognitive performance research
        </div>
      </div>
    </div>
  );
}