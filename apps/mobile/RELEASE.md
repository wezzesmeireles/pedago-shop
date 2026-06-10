# Publicar na Google Play

## Pré-requisitos (uma vez)
- Conta **Google Play Console** (US$25, pagamento único).
- **Política de privacidade** publicada — usar `https://sitepedagogico.com.br/politica-privacidade`.
- Ícone definitivo (ver `resources/README.md`).

## Keystore (assinatura)
A **keystore** fica em `android/sitepedagogico.keystore` e as credenciais em
`android/keystore.properties` — **os dois são gitignored** (NUNCA versionar).

> ⚠️ **FAÇA BACKUP da keystore + senha em local seguro.** Se perder, você **não
> consegue mais atualizar o app** publicado na Play (teria que publicar um app
> novo, com outro nome de pacote). Guarde num gerenciador de senhas / cofre.

Para gerar/regerar a keystore (ex.: trocar a senha antes do 1º envio):
```bash
keytool -genkeypair -v -keystore android/sitepedagogico.keystore \
  -alias sitepedagogico -keyalg RSA -keysize 2048 -validity 10000
```
Depois atualize `android/keystore.properties`:
```
storeFile=sitepedagogico.keystore
storePassword=SUA_SENHA
keyAlias=sitepedagogico
keyPassword=SUA_SENHA
```

## Gerar o AAB assinado
```bash
# 1. build web (modo mobile) + sync dos assets
pnpm --filter mobile run sync

# 2. gerar o Android App Bundle assinado
cd apps/mobile/android
./gradlew.bat bundleRelease        # Windows
# ou ./gradlew bundleRelease       # macOS/Linux
```
Saída: `apps/mobile/android/app/build/outputs/bundle/release/app-release.aab`

Suba esse `.aab` na Play Console. A cada novo envio, **incremente
`versionCode`** (e ajuste `versionName`) em `android/app/build.gradle`.

## Testar um build de release localmente (opcional)
O AAB não instala direto no aparelho. Para testar o pacote de release, use a
APK de debug (`./gradlew.bat assembleDebug` → `adb install`) ou extraia APKs do
AAB com o `bundletool`.
