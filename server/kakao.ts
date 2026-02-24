const KAKAO_AUTH_URL = 'https://kauth.kakao.com/oauth/authorize'
const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token'
const KAKAO_USER_URL = 'https://kapi.kakao.com/v2/user/me'

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing env: ${key}`)
  return value
}

export function getAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: getEnv('KAKAO_CLIENT_ID'),
    redirect_uri: getEnv('KAKAO_REDIRECT_URI'),
    state,
  })
  return `${KAKAO_AUTH_URL}?${params}`
}

export async function exchangeCode(code: string): Promise<string> {
  const res = await fetch(KAKAO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: getEnv('KAKAO_CLIENT_ID'),
      client_secret: getEnv('KAKAO_CLIENT_SECRET'),
      redirect_uri: getEnv('KAKAO_REDIRECT_URI'),
      code,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Kakao token exchange failed: ${text}`)
  }

  const data = (await res.json()) as { access_token: string }
  return data.access_token
}

interface KakaoUserInfo {
  id: string
  nickname: string | null
  profileImage: string | null
}

export async function getUserInfo(accessToken: string): Promise<KakaoUserInfo> {
  const res = await fetch(KAKAO_USER_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Kakao user info failed: ${text}`)
  }

  const data = (await res.json()) as {
    id: number
    kakao_account?: {
      profile?: {
        nickname?: string
        profile_image_url?: string
      }
    }
  }

  return {
    id: String(data.id),
    nickname: data.kakao_account?.profile?.nickname ?? null,
    profileImage: data.kakao_account?.profile?.profile_image_url ?? null,
  }
}
