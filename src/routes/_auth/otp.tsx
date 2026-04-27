import { createFileRoute } from '@tanstack/react-router'
import OtpForm from '../../components/auth/OtpForm'

export const Route = createFileRoute('/_auth/otp')({
  component: OtpForm,
})
