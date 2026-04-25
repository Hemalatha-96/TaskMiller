export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  phone?: string
}

export interface OtpPayload {
  email: string
  otp?: string
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    name: string
    email: string
    role: string
    orgId?: string
    avatar?: string
  }
}
