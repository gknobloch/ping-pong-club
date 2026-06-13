import { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Platform,
  Alert,
} from 'react-native'
import Constants from 'expo-constants'
import * as WebBrowser from 'expo-web-browser'
import * as Google from 'expo-auth-session/providers/google'
import { useAuth, DEV_LOGIN } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/DataContext'
import { getRoleLabel, getDisplayName } from '@/utils/roles'
import { sortByName } from '@/utils/sortByName'
import { colors } from '@/constants/colors'
import type { ApiError } from '@/utils/api'
import type { User } from '@shared/types'

WebBrowser.maybeCompleteAuthSession()

const extra = (Constants.expoConfig?.extra ?? {}) as {
  googleWebClientId?: string
  googleIosClientId?: string
  googleAndroidClientId?: string
}
const googleConfigured = Boolean(extra.googleWebClientId || extra.googleIosClientId || extra.googleAndroidClientId)

// Map backend error codes to French messages.
function authErrorMessage(e: unknown): string {
  const code = (e as ApiError)?.code
  switch (code) {
    case 'invalid_code':
      return 'Code invalide ou expiré.'
    case 'too_many_attempts':
      return 'Trop de tentatives. Demandez un nouveau code.'
    case 'no_account':
      return 'Aucun compte associé à cet e-mail.'
    case 'invalid_email':
      return 'Adresse e-mail invalide.'
    default:
      return 'Une erreur est survenue. Réessayez.'
  }
}

export default function LoginScreen() {
  const { requestCode, verifyCode, loginWithIdToken, loginWithApple } = useAuth()

  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // --- Google OAuth (hook must live in the component) ---
  const [, googleResponse, googlePrompt] = Google.useAuthRequest({
    webClientId: extra.googleWebClientId,
    iosClientId: extra.googleIosClientId,
    androidClientId: extra.googleAndroidClientId,
  })

  useEffect(() => {
    if (googleResponse?.type !== 'success') return
    const idToken = googleResponse.params?.id_token ?? googleResponse.authentication?.idToken
    if (!idToken) return
    setBusy(true)
    setError(null)
    loginWithIdToken('google', idToken)
      .catch((e) => setError(authErrorMessage(e)))
      .finally(() => setBusy(false))
  }, [googleResponse, loginWithIdToken])

  async function handleRequestCode() {
    if (!email.includes('@')) {
      setError('Adresse e-mail invalide.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { devCode } = await requestCode(email.trim())
      setDevCode(devCode ?? null)
      setStep('code')
    } catch (e) {
      setError(authErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  async function handleVerify() {
    setBusy(true)
    setError(null)
    try {
      await verifyCode(email.trim(), code.trim())
      // On success the AuthGuard navigates away.
    } catch (e) {
      setError(authErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogle() {
    if (!googleConfigured) {
      Alert.alert('Google', "La connexion Google n'est pas encore configurée.")
      return
    }
    setError(null)
    await googlePrompt()
  }

  async function handleApple() {
    setBusy(true)
    setError(null)
    try {
      await loginWithApple()
    } catch (e) {
      // User cancellation throws ERR_REQUEST_CANCELED — stay silent for that.
      if ((e as { code?: string })?.code !== 'ERR_REQUEST_CANCELED') {
        setError(authErrorMessage(e))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Ping-Pong Club</Text>
          <Text style={styles.subtitle}>
            {step === 'email' ? 'Connectez-vous pour continuer' : `Code envoyé à ${email}`}
          </Text>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {step === 'email' ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Adresse e-mail"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              editable={!busy}
            />
            <TouchableOpacity
              style={[styles.primaryBtn, busy && styles.btnDisabled]}
              onPress={handleRequestCode}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Recevoir un code</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity style={styles.oauthBtn} onPress={handleGoogle} disabled={busy}>
              <Text style={styles.oauthBtnText}>Continuer avec Google</Text>
            </TouchableOpacity>
            {Platform.OS === 'ios' && (
              <TouchableOpacity style={[styles.oauthBtn, styles.appleBtn]} onPress={handleApple} disabled={busy}>
                <Text style={[styles.oauthBtnText, styles.appleBtnText]}>Continuer avec Apple</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="123456"
              placeholderTextColor={colors.textSecondary}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              textContentType="oneTimeCode"
              autoFocus
              editable={!busy}
            />
            {devCode && <Text style={styles.devCode}>Code (dev) : {devCode}</Text>}
            <TouchableOpacity
              style={[styles.primaryBtn, (busy || code.length < 6) && styles.btnDisabled]}
              onPress={handleVerify}
              disabled={busy || code.length < 6}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Se connecter</Text>
              )}
            </TouchableOpacity>
            <View style={styles.linkRow}>
              <TouchableOpacity onPress={handleRequestCode} disabled={busy}>
                <Text style={styles.link}>Renvoyer le code</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setStep('email')
                  setCode('')
                  setDevCode(null)
                  setError(null)
                }}
                disabled={busy}
              >
                <Text style={styles.link}>Modifier l’e-mail</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {DEV_LOGIN && <DevLogin />}
      </ScrollView>
    </SafeAreaView>
  )
}

// ---------------------------------------------------------------------------
// Dev-only "pick any user" login (hidden behind DEV_LOGIN)
// ---------------------------------------------------------------------------
function DevLogin() {
  const { availableUsers, devLoginAs } = useAuth()
  const { players } = useAppData()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selecting, setSelecting] = useState<string | null>(null)

  const users = useMemo(() => {
    const q = query.trim().toLowerCase()
    const all = q
      ? availableUsers.filter((u) => {
          const name = getDisplayName(u, players).toLowerCase()
          return name.includes(q) || u.email.toLowerCase().includes(q)
        })
      : availableUsers
    const adminRoles = new Set(['general_admin', 'club_admin'])
    const admins = all.filter((u) => adminRoles.has(u.role))
    const withPlayers = all
      .filter((u) => !adminRoles.has(u.role) && u.playerId)
      .map((u) => {
        const p = players.find((pl) => pl.id === u.playerId)
        return { user: u, lastName: p?.lastName ?? '', firstName: p?.firstName ?? '' }
      })
    return [...admins, ...sortByName(withPlayers).map((x) => x.user)]
  }, [availableUsers, players, query])

  async function handleSelect(user: User) {
    setSelecting(user.id)
    await devLoginAs(user.id)
    setSelecting(null)
  }

  return (
    <View style={styles.devSection}>
      <TouchableOpacity onPress={() => setOpen((o) => !o)}>
        <Text style={styles.devToggle}>{open ? '▾' : '▸'} Connexion dev (test)</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.devBody}>
          <TextInput
            style={styles.input}
            placeholder="Rechercher…"
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {users.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={styles.card}
              onPress={() => handleSelect(user)}
              disabled={selecting === user.id}
            >
              <View style={styles.cardBody}>
                <Text style={styles.name}>{getDisplayName(user, players)}</Text>
                <Text style={styles.role}>{getRoleLabel(user.role)}</Text>
              </View>
              {selecting === user.id && <ActivityIndicator size="small" color={colors.accent} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 24, paddingTop: 48, paddingBottom: 40, gap: 12 },
  header: { marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginTop: 6 },
  error: { color: colors.danger, fontSize: 14, fontWeight: '500' },
  input: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  codeInput: { fontSize: 24, letterSpacing: 8, textAlign: 'center' },
  devCode: { color: colors.textSecondary, fontSize: 13 },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textSecondary, fontSize: 13 },
  oauthBtn: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: 'center',
  },
  oauthBtnText: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  appleBtn: { backgroundColor: '#000', borderColor: '#000' },
  appleBtnText: { color: '#fff' },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  link: { color: colors.accent, fontSize: 14, fontWeight: '500' },
  // Dev section
  devSection: { marginTop: 24, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 },
  devToggle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
  devBody: { gap: 8, marginTop: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBody: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  role: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
})
