import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useProfileContext } from '../../context/ProfileContext'
import { useDoctorQuestions } from '../../hooks/useDoctorQuestions'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'

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

export default function DoctorQuestionsPage() {
  const { t } = useTranslation()
  const { activeProfileId } = useProfileContext()
  const { questions, loading, toggleQuestion, addCustomQuestion, deleteCustomQuestion } = useDoctorQuestions(activeProfileId)
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

  const checkedCount = questions.filter(q => q.is_checked).length

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">{t('doctor.title')}</h1>
        <p className="text-gray-500">{t('doctor.subtitle')}</p>
        {questions.length > 0 && (
          <p className="text-sm text-primary-600 font-medium mt-1">
            {checkedCount}/{questions.length} marcadas
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <>
          {/* Predefined */}
          <Card>
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

          {/* Custom */}
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
  )
}
