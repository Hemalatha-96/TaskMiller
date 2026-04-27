export interface LoginPayload {
  email: string
  password: string
}

export interface OtpRequestPayload {
  email: string
}

export interface OtpVerifyPayload {
  email: string
  otp: string
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
}
