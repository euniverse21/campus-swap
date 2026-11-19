import { useLanguage } from '../i18n/useLanguage'

export function NotFound() {
  const { t } = useLanguage()
  return <p className="page-message">{t('common.pageNotFound')}</p>
}
