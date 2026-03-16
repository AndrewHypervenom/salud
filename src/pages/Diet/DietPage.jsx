import { useTranslation } from 'react-i18next'
import { Card } from '../../components/ui/Card'

function ListSection({ title, items, icon, itemColor }) {
  return (
    <Card>
      <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span className="text-xl">{icon}</span> {title}
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
        icon="✅"
        itemColor="text-green-700"
      />
      <ListSection
        title={t('diet.section_avoid')}
        items={avoidItems}
        icon="🚫"
        itemColor="text-red-700"
      />
      <ListSection
        title={t('diet.section_tips')}
        items={tipItems}
        icon="💡"
        itemColor="text-blue-700"
      />
    </div>
  )
}
