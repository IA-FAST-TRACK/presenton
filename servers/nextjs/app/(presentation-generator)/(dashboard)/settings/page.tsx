import React from 'react'
import SettingPage from './SettingPage'
import UserAccountSettings from './UserAccountSettings'
import { getServerAuthStatus } from '@/utils/serverAuth'
import { getSettingsView } from '@/utils/settingsAccess'

export const metadata = {
  title: 'Ajustes | Presenton',
  description: 'Página de ajustes',
}
const page = async () => {
  const status = await getServerAuthStatus()

  return getSettingsView(status.role) === 'admin'
    ? <SettingPage />
    : <UserAccountSettings username={status.username ?? 'Usuario'} />
}

export default page
