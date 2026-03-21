import { useTranslation } from 'react-i18next'
import { CheckCircle2, Ban, Lightbulb } from 'lucide-react'
import { Card } from '../../components/ui/Card'

function ListSection({ title, items, Icon, iconClass, itemColor }) {
  return (
    <Card>
      <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <Icon size={18} strokeWidth={1.75} className={iconClass} /> {title}
      </h2>
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={i} className={`flex items-start gap-2 text-sm ${itemColor}`}>
            <span className="mt-0.5 flex-shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default function DietPage() {
  const { t } = useTranslation()

  const eatItems = t('diet.eat', { returnObjects: true })
  const avoidItems = t('diet.avoid', { returnObjects: true })
  const tipItems = t('diet.tips', { returnObjects: true })

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">{t('diet.title')}</h1>
        <p className="text-gray-500">{t('diet.subtitle')}</p>
      </div>

      <ListSection
        title={t('diet.section_eat')}
        items={eatItems}
        Icon={CheckCircle2}
        iconClass="text-green-600"
        itemColor="text-green-700 dark:text-green-400"
      />
      <ListSection
        title={t('diet.section_avoid')}
        items={avoidItems}
        Icon={Ban}
        iconClass="text-red-500"
        itemColor="text-red-700 dark:text-red-400"
      />
      <ListSection
        title={t('diet.section_tips')}
        items={tipItems}
        Icon={Lightbulb}
        iconClass="text-blue-500"
        itemColor="text-blue-700 dark:text-blue-400"
      />
    </div>
  )
}
