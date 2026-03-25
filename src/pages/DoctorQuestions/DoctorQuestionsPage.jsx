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
    padding: 12mm 18mm; font-size: 10.5pt; color: #111; background: #fff;
  }
  .no-print { display: none !important; }
  .report-card { break-inside: avoid; margin-bottom: 8pt; border: 0.75pt solid #d1d5db; border-radius: 5pt; padding: 9pt; }
  .specialty-header { border-left: 3pt solid; padding-left: 8pt; margin-bottom: 6pt; }
  .specialty-medicine { border-color: #2563eb; }
  .specialty-nutrition { border-color: #16a34a; }
  .bp-normal { color: #16a34a !important; font-weight: 600; }
  .bp-elevated { color: #ca8a04 !important; font-weight: 600; }
  .bp-high { color: #dc2626 !important; font-weight: 600; }
  .stat-row { display: flex; justify-content: space-between; padding: 2pt 0; border-bottom: 0.5pt solid #f3f4f6; font-size: 10pt; }
  .q-list li { padding: 2pt 0; }
  h2 { font-size: 13pt; }
  h3 { font-size: 11pt; }
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
      <button onClick={() => onDelete(question.id)} className="text-red-300 hover:text-red-500 text-xs flex-shrink-0">✕</button>
    </div>
  )
}

function ReportCard({ children, className = '' }) {
  return (
    <div className={`report-card rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      {children}
    </div>
  )
}

function StatRow({ label, value, sub, highlight }) {
  return (
    <div className="stat-row flex justify-between items-baseline py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`text-sm font-semibold text-right ${highlight || 'text-gray-900 dark:text-gray-100'}`}>
        {value}
        {sub && <span className="text-xs font-normal text-gray-400 ml-1">{sub}</span>}
      </span>
    </div>
  )
}

function SpecialtySection({ color, icon, title, summary, questions, dataCards }) {
  const borderColor = color === 'blue' ? 'border-blue-500' : 'border-green-500'
  const bgColor = color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-green-50 dark:bg-green-900/20'
  const textColor = color === 'blue' ? 'text-blue-700 dark:text-blue-300' : 'text-green-700 dark:text-green-300'
  const specClass = color === 'blue' ? 'specialty-medicine' : 'specialty-nutrition'

  return (
    <div className={`rounded-2xl border-2 ${borderColor} overflow-hidden`}>
      {/* Header de especialidad */}
      <div className={`${bgColor} px-4 py-3 flex items-center gap-2`}>
        <span className="text-2xl">{icon}</span>
        <div>
          <h3 className={`font-bold text-base ${textColor} specialty-header ${specClass}`}>{title}</h3>
          {summary && <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">{summary}</p>}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Tarjetas de datos */}
        {dataCards}

        {/* Preguntas para llevar */}
        {questions.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Preguntas que llevar</p>
            <ol className="q-list space-y-1.5">
              {questions.map((q, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className={`font-bold flex-shrink-0 ${textColor}`}>{i + 1}.</span>
                  <span className="text-gray-800 dark:text-gray-100">{q}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
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

  // Solo mostrar preguntas sin question_key (custom: generadas por IA + manuales)
  const medicineQuestions = questions.filter(q => !q.question_key && q.category === 'medicine')
  const nutritionQuestions = questions.filter(q => !q.question_key && q.category === 'nutrition')
  const otherQuestions = questions.filter(q => !q.question_key && !q.category)
  const customQuestions = questions.filter(q => !q.question_key)
  const checkedCount = customQuestions.filter(q => q.is_checked).length

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

  // Datos del informe
  const bpClass = reportData?.bloodPressure?.avg_systolic
    ? classifyBP(reportData.bloodPressure.avg_systolic, reportData.bloodPressure.avg_diastolic, t)
    : null

  const weightTrend = reportData?.weight?.trend_kg
  const weightTrendLabel = !weightTrend || Math.abs(weightTrend) < 0.1
    ? t('doctor.report_trend_stable')
    : weightTrend > 0
      ? `${t('doctor.report_trend_gain')} (+${weightTrend} kg)`
      : `${t('doctor.report_trend_loss')} (${weightTrend} kg)`

  const bmi = activeProfile?.weight_kg && activeProfile?.height_cm
    ? Math.round((activeProfile.weight_kg / Math.pow(activeProfile.height_cm / 100, 2)) * 10) / 10
    : null

  const reportDate = reportData?.generatedAt
    ? new Date(reportData.generatedAt).toLocaleDateString()
    : ''

  return (
    <>
      <style>{PRINT_STYLE}</style>

      <div className="flex flex-col gap-4">
        {/* ===== SECCIÓN A: Preguntas (no imprimible) ===== */}
        <div className="no-print flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('doctor.title')}</h1>
            <p className="text-gray-500 text-sm">{t('doctor.subtitle')}</p>
          </div>

          {/* Botón generar */}
          <Button
            onClick={handleGenerate}
            disabled={generating || !activeProfile}
            className="w-full"
          >
            {generating ? (
              <><Spinner size="sm" /><span>{t('doctor.generating')}</span></>
            ) : (
              <><span>✨</span><span>{t('doctor.generate_ai')}</span></>
            )}
          </Button>

          {reportError && (
            <p className="text-red-500 text-sm">{t('doctor.report_error')}</p>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : customQuestions.length === 0 ? (
            <Card className="text-center py-8 text-gray-400">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-sm">Genera preguntas con IA para que aparezcan aquí adaptadas a tus datos</p>
            </Card>
          ) : (
            <>
              {/* Médico General */}
              {medicineQuestions.length > 0 && (
                <div className="rounded-2xl border-2 border-blue-200 dark:border-blue-800 overflow-hidden">
                  <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2.5 flex items-center gap-2">
                    <span className="text-xl">🩺</span>
                    <span className="font-semibold text-blue-700 dark:text-blue-300 text-sm">Médico General / Medicina Interna</span>
                    <span className="ml-auto text-xs text-blue-500">
                      {medicineQuestions.filter(q => q.is_checked).length}/{medicineQuestions.length}
                    </span>
                  </div>
                  <div className="p-3 flex flex-col gap-2">
                    {medicineQuestions.map(q => (
                      <QuestionItem key={q.id} question={q} onToggle={toggleQuestion} onDelete={deleteCustomQuestion} t={t} />
                    ))}
                  </div>
                </div>
              )}

              {/* Nutricionista */}
              {nutritionQuestions.length > 0 && (
                <div className="rounded-2xl border-2 border-green-200 dark:border-green-800 overflow-hidden">
                  <div className="bg-green-50 dark:bg-green-900/20 px-4 py-2.5 flex items-center gap-2">
                    <span className="text-xl">🥦</span>
                    <span className="font-semibold text-green-700 dark:text-green-300 text-sm">Nutricionista / Dietista</span>
                    <span className="ml-auto text-xs text-green-500">
                      {nutritionQuestions.filter(q => q.is_checked).length}/{nutritionQuestions.length}
                    </span>
                  </div>
                  <div className="p-3 flex flex-col gap-2">
                    {nutritionQuestions.map(q => (
                      <QuestionItem key={q.id} question={q} onToggle={toggleQuestion} onDelete={deleteCustomQuestion} t={t} />
                    ))}
                  </div>
                </div>
              )}

              {/* Preguntas manuales sin categoría */}
              {otherQuestions.length > 0 && (
                <Card>
                  <h2 className="font-semibold text-gray-700 dark:text-gray-200 text-sm mb-2">Otras preguntas</h2>
                  <div className="flex flex-col gap-2">
                    {otherQuestions.map(q => (
                      <QuestionItem key={q.id} question={q} onToggle={toggleQuestion} onDelete={deleteCustomQuestion} t={t} />
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}

          {/* Agregar pregunta manual siempre visible */}
          <Card>
            <h2 className="font-semibold text-gray-700 dark:text-gray-200 text-sm mb-2">{t('doctor.add_custom')}</h2>
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
        </div>

        {/* ===== SECCIÓN B: Informe imprimible ===== */}
        {reportData && (
          <div className="flex flex-col gap-4">
            <Button
              onClick={() => window.print()}
              className="no-print w-full"
              variant="secondary"
            >
              <span>🖨️</span>
              <span>{t('doctor.print')}</span>
            </Button>

            <div id="doctor-print-report" className="flex flex-col gap-4">
              {/* Header del paciente */}
              <ReportCard className="border-gray-300 dark:border-gray-600">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('doctor.report_title')}</h2>
                    <p className="text-xs text-gray-400">{t('doctor.report_generated')} {reportDate}</p>
                  </div>
                  <span className="text-3xl">🏥</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div><span className="text-gray-400">Nombre: </span><span className="font-semibold">{activeProfile?.name}</span></div>
                  <div><span className="text-gray-400">Edad: </span><span className="font-semibold">{activeProfile?.age} años</span></div>
                  <div><span className="text-gray-400">Peso: </span><span className="font-semibold">{reportData.weight.current_kg} kg</span></div>
                  <div><span className="text-gray-400">Estatura: </span><span className="font-semibold">{activeProfile?.height_cm} cm</span></div>
                  {bmi && <div><span className="text-gray-400">IMC: </span><span className={`font-semibold ${bmi >= 30 ? 'text-red-500' : bmi >= 25 ? 'text-orange-500' : 'text-green-600'}`}>{bmi}</span></div>}
                  <div><span className="text-gray-400">Objetivo: </span><span className="font-semibold capitalize">{activeProfile?.health_goal?.replace(/_/g, ' ')}</span></div>
                </div>
                {reportData.attention_areas?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {reportData.attention_areas.map((area, i) => (
                      <span key={i} className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded-full">{area}</span>
                    ))}
                  </div>
                )}
              </ReportCard>

              {/* ===== Sección Médico General ===== */}
              <SpecialtySection
                color="blue"
                icon="🩺"
                title="Médico General / Medicina Interna"
                summary={reportData.summary_medicine}
                questions={reportData.questions_medicine}
                dataCards={
                  <div className="flex flex-col gap-3">
                    {/* Peso y BMI */}
                    <ReportCard>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('doctor.report_weight_trend')}</p>
                      {reportData.weight.readings_count === 0 ? (
                        <p className="text-sm text-gray-400">{t('doctor.report_no_weight')}</p>
                      ) : (
                        <>
                          <StatRow label="Peso actual" value={`${reportData.weight.current_kg} kg`} />
                          {bmi && <StatRow label="IMC" value={bmi} highlight={bmi >= 30 ? 'text-red-500' : bmi >= 25 ? 'text-orange-500' : 'text-green-600'} />}
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
                    </ReportCard>

                    {/* Presión arterial */}
                    <ReportCard>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('doctor.report_bp_section')}</p>
                      {reportData.bloodPressure.readings.length === 0 ? (
                        <p className="text-sm text-gray-400">{t('doctor.report_no_bp')}</p>
                      ) : (
                        <>
                          {bpClass && <div className={`text-sm font-semibold mb-2 ${bpClass.cls}`}>{bpClass.label}</div>}
                          {reportData.bloodPressure.avg_systolic && (
                            <StatRow label="Promedio" value={`${reportData.bloodPressure.avg_systolic}/${reportData.bloodPressure.avg_diastolic} mmHg`} />
                          )}
                          <div className="mt-1 space-y-0.5">
                            {reportData.bloodPressure.readings.map((r, i) => (
                              <div key={i} className="text-xs text-gray-400 flex justify-between">
                                <span>{r.measured_at}</span>
                                <span className={classifyBP(r.systolic, r.diastolic, t).cls}>
                                  {r.systolic}/{r.diastolic} mmHg
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </ReportCard>

                    {/* Ejercicio */}
                    <ReportCard>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('doctor.report_exercise')}</p>
                      <StatRow
                        label={t('doctor.report_days_active')}
                        value={`${reportData.exercise.days_active_14d}/14`}
                        highlight={reportData.exercise.days_active_14d < 3 ? 'text-orange-500' : 'text-green-600'}
                      />
                      <StatRow label="Tiempo total (14d)" value={`${reportData.exercise.total_minutes_14d} min`} />
                      {reportData.exercise.types.length > 0 && (
                        <StatRow label="Actividades" value={reportData.exercise.types.join(', ')} />
                      )}
                    </ReportCard>
                  </div>
                }
              />

              {/* ===== Sección Nutricionista ===== */}
              <SpecialtySection
                color="green"
                icon="🥦"
                title="Nutricionista / Dietista"
                summary={reportData.summary_nutrition}
                questions={reportData.questions_nutrition}
                dataCards={
                  <div className="flex flex-col gap-3">
                    {/* Nutrición */}
                    <ReportCard>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('doctor.report_nutrition')}</p>
                      <StatRow label={t('doctor.report_target')} value={`${reportData.calTarget} kcal/día`} />
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
                    </ReportCard>

                    {/* Hábitos */}
                    <ReportCard>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('doctor.report_habits')}</p>
                      <StatRow
                        label={t('doctor.report_compliance')}
                        value={`${reportData.habits.completion_pct_30d}%`}
                        highlight={reportData.habits.completion_pct_30d < 60 ? 'text-orange-500' : 'text-green-600'}
                      />
                      {reportData.habits.habit_names?.length > 0 && (
                        <StatRow label="Hábitos activos" value={reportData.habits.habit_names.slice(0, 4).join(', ')} />
                      )}
                      {reportData.habits.low_compliance?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {reportData.habits.low_compliance.map((h, i) => (
                            <span key={i} className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 px-2 py-0.5 rounded-full">{h}</span>
                          ))}
                        </div>
                      )}
                    </ReportCard>
                  </div>
                }
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
