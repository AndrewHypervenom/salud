import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useProfileContext } from '../../context/ProfileContext'
import { useProfiles } from '../../hooks/useProfiles'
import { useDoctorQuestions } from '../../hooks/useDoctorQuestions'
import { useDoctorReport } from '../../hooks/useDoctorReport'
import { useFoodLogsByDay } from '../../hooks/useFoodLogs'
import { useWeightLogs } from '../../hooks/useWeightLogs'
import { useBloodPressure } from '../../hooks/useBloodPressure'
import { useHabits } from '../../hooks/useHabits'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'

const PRINT_STYLE = `
@media print {
  body > * { visibility: hidden; }
  #doctor-print-report, #doctor-print-report * { visibility: visible; }
  #doctor-print-report {
    position: absolute; top: 0; left: 0; width: 100%;
    padding: 15mm 20mm; font-size: 11pt; color: #000; background: #fff;
  }
  .no-print { display: none !important; }
  .report-card { break-inside: avoid; margin-bottom: 10pt; border: 1pt solid #e5e7eb; border-radius: 6pt; padding: 10pt; }
  .bp-normal { color: #16a34a !important; }
  .bp-elevated { color: #ca8a04 !important; }
  .bp-high { color: #dc2626 !important; }
}
`

function classifyBP(systolic, diastolic, t) {
  if (!systolic || !diastolic) return { label: t('doctor.report_no_bp'), cls: '' }
  if (systolic >= 180 || diastolic >= 120) return { label: t('doctor.report_bp_crisis'), cls: 'bp-high' }
  if (systolic >= 140 || diastolic >= 90) return { label: t('doctor.report_bp_high2'), cls: 'bp-high' }
  if (systolic >= 130 || diastolic >= 80) return { label: t('doctor.report_bp_high1'), cls: 'bp-elevated' }
  if (systolic >= 120 && diastolic < 80) return { label: t('doctor.report_bp_elevated'), cls: 'bp-elevated' }
  return { label: t('doctor.report_bp_normal'), cls: 'bp-normal' }
}

function QuestionItem({ question, onToggle, onDelete, t }) {
  const text = question.question_key
    ? t(`doctor.questions.${question.question_key}`)
    : question.custom_text

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${question.is_checked ? 'bg-green-50 dark:bg-green-900/30' : 'bg-gray-50 dark:bg-gray-700'}`}>
      <button
        onClick={() => onToggle(question)}
        className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
          question.is_checked
            ? 'bg-primary-600 border-primary-600 text-white'
            : 'border-gray-300 hover:border-primary-400'
        }`}
      >
        {question.is_checked && (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <span className={`flex-1 text-sm leading-relaxed ${question.is_checked ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
        {text}
      </span>
      {!question.question_key && (
        <button onClick={() => onDelete(question.id)} className="text-red-300 hover:text-red-500 text-xs flex-shrink-0">✕</button>
      )}
    </div>
  )
}

function ReportSection({ title, children, className = '' }) {
  return (
    <div className={`report-card rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <h3 className="font-bold text-sm uppercase tracking-wide text-gray-500 mb-3">{title}</h3>
      {children}
    </div>
  )
}

function StatRow({ label, value, sub, highlight }) {
  return (
    <div className="flex justify-between items-baseline py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className={`text-sm font-semibold ${highlight || 'text-gray-900 dark:text-gray-100'}`}>
        {value}
        {sub && <span className="text-xs font-normal text-gray-400 ml-1">{sub}</span>}
      </span>
    </div>
  )
}

export default function DoctorQuestionsPage() {
  const { t } = useTranslation()
  const { activeProfileId } = useProfileContext()
  const { profiles } = useProfiles(activeProfileId)
  const activeProfile = profiles[0] ?? null

  const { questions, loading, toggleQuestion, addCustomQuestion, deleteCustomQuestion, fetchQuestions } = useDoctorQuestions(activeProfileId)
  const { foodLogsByDay } = useFoodLogsByDay(activeProfileId, 60)
  const { logs: weightLogs } = useWeightLogs(activeProfileId)
  const { readings: bpReadings } = useBloodPressure(activeProfileId)
  const { habits } = useHabits(activeProfileId)

  const { generating, reportData, error: reportError, generateReport } = useDoctorReport(activeProfileId)

  const [customText, setCustomText] = useState('')
  const [adding, setAdding] = useState(false)

  if (!activeProfileId) {
    return (
      <Card className="text-center py-10 text-gray-400">
        <p className="text-3xl mb-3">👨‍⚕️</p>
        <p>{t('doctor.no_profile')}</p>
      </Card>
    )
  }

  const predefined = questions.filter(q => q.question_key)
  const custom = questions.filter(q => !q.question_key)
  const checkedCount = questions.filter(q => q.is_checked).length
  const checkedQuestions = questions.filter(q => q.is_checked)

  const handleAdd = async () => {
    if (!customText.trim()) return
    setAdding(true)
    try {
      await addCustomQuestion(customText)
      setCustomText('')
    } finally {
      setAdding(false)
    }
  }

  const handleGenerate = async () => {
    if (!activeProfile) return
    await generateReport({ profile: activeProfile, foodLogsByDay, weightLogs, bpReadings, habits })
    await fetchQuestions()
  }

  // --- Clasificación de presión para el informe ---
  const bpClass = reportData?.bloodPressure?.avg_systolic
    ? classifyBP(reportData.bloodPressure.avg_systolic, reportData.bloodPressure.avg_diastolic, t)
    : null

  // --- Tendencia de peso ---
  const weightTrend = reportData?.weight?.trend_kg
  const weightTrendLabel = !weightTrend || Math.abs(weightTrend) < 0.1
    ? t('doctor.report_trend_stable')
    : weightTrend > 0
      ? `${t('doctor.report_trend_gain')} (+${weightTrend} kg)`
      : `${t('doctor.report_trend_loss')} (${weightTrend} kg)`

  const reportDate = reportData?.generatedAt
    ? new Date(reportData.generatedAt).toLocaleDateString()
    : ''

  return (
    <>
      <style>{PRINT_STYLE}</style>

      <div className="flex flex-col gap-4">
        {/* ===== SECCIÓN A: Preguntas ===== */}
        <div className="no-print">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">{t('doctor.title')}</h1>
            <p className="text-gray-500 text-sm">{t('doctor.subtitle')}</p>
            {questions.length > 0 && (
              <p className="text-sm text-primary-600 font-medium mt-1">
                {checkedCount}/{questions.length} marcadas
              </p>
            )}
          </div>

          {/* Botón generar con IA */}
          <Button
            onClick={handleGenerate}
            disabled={generating || !activeProfile}
            className="w-full flex items-center justify-center gap-2 mb-4"
          >
            {generating ? (
              <>
                <Spinner size="sm" />
                <span>{t('doctor.generating')}</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>{t('doctor.generate_ai')}</span>
              </>
            )}
          </Button>

          {reportError && (
            <p className="text-red-500 text-sm mb-3">{t('doctor.report_error')}</p>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <>
              {/* Preguntas predefinidas */}
              {predefined.length > 0 && (
                <Card className="mb-4">
                  <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3">{t('doctor.predefined_title')}</h2>
                  <div className="flex flex-col gap-2">
                    {predefined.map(q => (
                      <QuestionItem
                        key={q.id}
                        question={q}
                        onToggle={toggleQuestion}
                        onDelete={deleteCustomQuestion}
                        t={t}
                      />
                    ))}
                  </div>
                </Card>
              )}

              {/* Preguntas personalizadas (IA + manuales) */}
              <Card>
                <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3">{t('doctor.custom_title')}</h2>
                {custom.length > 0 && (
                  <div className="flex flex-col gap-2 mb-4">
                    {custom.map(q => (
                      <QuestionItem
                        key={q.id}
                        question={q}
                        onToggle={toggleQuestion}
                        onDelete={deleteCustomQuestion}
                        t={t}
                      />
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder={t('doctor.custom_placeholder')}
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    className="flex-1"
                  />
                  <Button onClick={handleAdd} disabled={adding || !customText.trim()} className="flex-shrink-0">
                    {adding ? <Spinner size="sm" /> : t('doctor.add')}
                  </Button>
                </div>
              </Card>
            </>
          )}
        </div>

        {/* ===== SECCIÓN B: Informe imprimible ===== */}
        {reportData && (
          <div>
            {/* Botón imprimir (oculto al imprimir) */}
            <Button
              onClick={() => window.print()}
              className="no-print w-full flex items-center justify-center gap-2 mb-4"
              variant="secondary"
            >
              <span>🖨️</span>
              <span>{t('doctor.print')}</span>
            </Button>

            <div id="doctor-print-report" className="flex flex-col gap-4">
              {/* Header del paciente */}
              <div className="report-card rounded-xl border-2 border-primary-500 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('doctor.report_title')}</h2>
                    <p className="text-sm text-gray-500">{t('doctor.report_generated')} {reportDate}</p>
                  </div>
                  <span className="text-3xl">🏥</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Nombre: </span><span className="font-medium">{activeProfile?.name}</span></div>
                  <div><span className="text-gray-500">Edad: </span><span className="font-medium">{activeProfile?.age} años</span></div>
                  <div><span className="text-gray-500">Peso: </span><span className="font-medium">{reportData.weight.current_kg} kg</span></div>
                  <div><span className="text-gray-500">Estatura: </span><span className="font-medium">{activeProfile?.height_cm} cm</span></div>
                </div>
              </div>

              {/* Nutrición */}
              <ReportSection title={t('doctor.report_nutrition')}>
                <StatRow
                  label={t('doctor.report_avg_7d')}
                  value={`${reportData.nutrition.avg7d_calories} kcal`}
                  sub={`(${reportData.nutrition.days_logged_7d}/7 ${t('doctor.report_days_logged')})`}
                  highlight={reportData.nutrition.avg7d_calories > reportData.calTarget * 1.15 ? 'text-orange-500' : undefined}
                />
                <StatRow
                  label={t('doctor.report_avg_30d')}
                  value={`${reportData.nutrition.avg30d_calories} kcal`}
                  sub={`(${reportData.nutrition.days_logged_30d}/30 ${t('doctor.report_days_logged')})`}
                />
                <StatRow
                  label={t('doctor.report_target')}
                  value={`${reportData.calTarget} kcal/día`}
                />
              </ReportSection>

              {/* Peso */}
              <ReportSection title={t('doctor.report_weight_trend')}>
                {reportData.weight.readings_count === 0 ? (
                  <p className="text-sm text-gray-400">{t('doctor.report_no_weight')}</p>
                ) : (
                  <>
                    <StatRow label="Peso actual" value={`${reportData.weight.current_kg} kg`} />
                    {activeProfile?.target_weight_kg && (
                      <StatRow
                        label="Peso objetivo"
                        value={`${activeProfile.target_weight_kg} kg`}
                        sub={`(${Math.round((reportData.weight.current_kg - activeProfile.target_weight_kg) * 10) / 10} kg restantes)`}
                      />
                    )}
                    <StatRow
                      label="Tendencia"
                      value={weightTrendLabel}
                      highlight={weightTrend > 0.5 ? 'text-orange-500' : weightTrend < -0.1 ? 'text-green-600' : undefined}
                    />
                  </>
                )}
              </ReportSection>

              {/* Presión arterial */}
              <ReportSection title={t('doctor.report_bp_section')}>
                {reportData.bloodPressure.readings.length === 0 ? (
                  <p className="text-sm text-gray-400">{t('doctor.report_no_bp')}</p>
                ) : (
                  <>
                    {bpClass && (
                      <div className={`text-sm font-semibold mb-2 ${bpClass.cls}`}>{bpClass.label}</div>
                    )}
                    {reportData.bloodPressure.avg_systolic && (
                      <StatRow label="Promedio" value={`${reportData.bloodPressure.avg_systolic}/${reportData.bloodPressure.avg_diastolic} mmHg`} />
                    )}
                    <div className="mt-2 space-y-1">
                      {reportData.bloodPressure.readings.map((r, i) => (
                        <div key={i} className="text-xs text-gray-500 flex justify-between">
                          <span>{r.measured_at}</span>
                          <span className={classifyBP(r.systolic, r.diastolic, t).cls}>
                            {r.systolic}/{r.diastolic} mmHg
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </ReportSection>

              {/* Ejercicio */}
              <ReportSection title={t('doctor.report_exercise')}>
                <StatRow
                  label={t('doctor.report_days_active')}
                  value={`${reportData.exercise.days_active_14d}/14`}
                  highlight={reportData.exercise.days_active_14d < 3 ? 'text-orange-500' : 'text-green-600'}
                />
                <StatRow label="Tiempo total (14d)" value={`${reportData.exercise.total_minutes_14d} min`} />
                {reportData.exercise.types.length > 0 && (
                  <StatRow label="Actividades" value={reportData.exercise.types.join(', ')} />
                )}
              </ReportSection>

              {/* Hábitos */}
              <ReportSection title={t('doctor.report_habits')}>
                <StatRow
                  label={t('doctor.report_compliance')}
                  value={`${reportData.habits.completion_pct_30d}%`}
                  highlight={reportData.habits.completion_pct_30d < 60 ? 'text-orange-500' : 'text-green-600'}
                />
                {reportData.habits.low_compliance.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Baja adherencia:</p>
                    <div className="flex flex-wrap gap-1">
                      {reportData.habits.low_compliance.map((h, i) => (
                        <span key={i} className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 px-2 py-0.5 rounded-full">{h}</span>
                      ))}
                    </div>
                  </div>
                )}
              </ReportSection>

              {/* Observaciones IA */}
              {(reportData.observations || reportData.attention_areas.length > 0) && (
                <ReportSection title={t('doctor.report_observations')}>
                  {reportData.observations && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">{reportData.observations}</p>
                  )}
                  {reportData.attention_areas.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('doctor.report_attention')}:</p>
                      <div className="flex flex-wrap gap-1">
                        {reportData.attention_areas.map((area, i) => (
                          <span key={i} className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded-full">{area}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </ReportSection>
              )}

              {/* Preguntas marcadas */}
              {checkedQuestions.length > 0 && (
                <ReportSection title={t('doctor.report_checked_questions')}>
                  <ol className="space-y-2">
                    {checkedQuestions.map((q, i) => (
                      <li key={q.id} className="text-sm flex gap-2">
                        <span className="font-bold text-primary-600 flex-shrink-0">{i + 1}.</span>
                        <span>{q.question_key ? t(`doctor.questions.${q.question_key}`) : q.custom_text}</span>
                      </li>
                    ))}
                  </ol>
                </ReportSection>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
