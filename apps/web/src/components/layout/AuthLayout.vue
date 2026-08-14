<template>
  <div class="auth-shell min-h-screen relative flex items-center justify-center p-3 sm:p-6 overflow-hidden">
    <div class="auth-grid" aria-hidden="true" />
    <span class="auth-doodle auth-doodle--star" aria-hidden="true">✦</span>
    <span class="auth-doodle auth-doodle--circle" aria-hidden="true" />
    <span class="auth-doodle auth-doodle--plus" aria-hidden="true">＋</span>

    <RouterLink to="/" class="auth-back" aria-label="Voltar para a página inicial">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m15 18-6-6 6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>Voltar ao site</span>
    </RouterLink>

    <div class="auth-card relative w-full max-w-5xl overflow-hidden animate-slide-in-up">
      <aside class="auth-showcase hidden md:flex">
        <div class="auth-showcase__dots" aria-hidden="true" />
        <RouterLink to="/" class="auth-showcase__logo">
          <img src="/site-pedagogico-logo.png" alt="Site Pedagógico" />
        </RouterLink>

        <div class="relative z-10 mt-auto">
          <span class="auth-kicker">Seu espaço pedagógico</span>
          <h1>Mais tempo para ensinar.<br><span>Mais alegria para aprender.</span></h1>
          <p>Materiais criativos e prontos para transformar cada aula em uma experiência especial.</p>

          <div class="auth-benefits">
            <div><span>⚡</span><strong>Download imediato</strong></div>
            <div><span>🎨</span><strong>Materiais coloridos</strong></div>
            <div><span>💜</span><strong>Feito para educadores</strong></div>
          </div>
        </div>

        <div class="auth-mascot" aria-hidden="true">
          <span class="auth-mascot__spark">✦</span>
          <span class="auth-mascot__book">📚</span>
        </div>
      </aside>

      <main class="auth-form-panel">
        <RouterLink to="/" class="auth-mobile-logo md:hidden">
          <img src="/site-pedagogico-logo.png" alt="Site Pedagógico" />
        </RouterLink>

        <div class="auth-form-content">
          <RouterView />
        </div>

        <p class="auth-copyright">© {{ new Date().getFullYear() }} {{ config.storeName }}</p>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSiteConfigStore } from '@/stores/site-config.store';
const { config } = useSiteConfigStore();
</script>

<style scoped>
.auth-shell {
  background:
    radial-gradient(circle at 8% 10%, rgba(0, 174, 189, 0.14), transparent 22rem),
    radial-gradient(circle at 92% 86%, rgba(255, 95, 162, 0.14), transparent 25rem),
    linear-gradient(145deg, #fffdf8, #fbf8ff 48%, #f7feff);
}
.auth-grid { position:absolute; inset:0; opacity:.3; background-image:radial-gradient(rgba(125,74,168,.18) 1px,transparent 1px); background-size:24px 24px; mask-image:linear-gradient(to bottom,black,transparent 82%); }
.auth-doodle { position:absolute; pointer-events:none; }
.auth-doodle--star { top:12%; left:7%; color:#ff5fa2; font-size:34px; transform:rotate(-12deg); }
.auth-doodle--circle { right:6%; top:17%; width:32px; height:32px; border:7px solid rgba(155,212,0,.62); border-radius:50%; transform:rotate(9deg); }
.auth-doodle--plus { right:9%; bottom:12%; color:#00aebd; font-size:42px; transform:rotate(13deg); }

.auth-back { position:fixed; top:18px; left:18px; z-index:20; display:inline-flex; align-items:center; gap:5px; padding:8px 11px; border:1px solid rgba(125,74,168,.1); border-radius:12px; color:#765a86; background:rgba(255,255,255,.76); backdrop-filter:blur(12px); font-size:12px; font-weight:700; }
.auth-back svg { width:16px; height:16px; }

.auth-card { display:grid; grid-template-columns:minmax(0,1.08fr) minmax(390px,.92fr); min-height:650px; border:1px solid rgba(125,74,168,.11); border-radius:34px; background:white; box-shadow:0 35px 80px -42px rgba(62,35,83,.5),0 14px 35px -28px rgba(0,174,189,.32); }
.auth-showcase { position:relative; flex-direction:column; padding:34px 42px 42px; overflow:hidden; color:white; background:radial-gradient(circle at 85% 15%,rgba(155,212,0,.24),transparent 17rem),radial-gradient(circle at 10% 92%,rgba(0,174,189,.28),transparent 19rem),linear-gradient(145deg,#694195,#8b52ac 52%,#d85395); }
.auth-showcase::after { content:''; position:absolute; inset:0; background:linear-gradient(115deg,rgba(255,255,255,.08),transparent 35%); pointer-events:none; }
.auth-showcase__dots { position:absolute; inset:0; opacity:.12; background-image:radial-gradient(white 1.5px,transparent 1.5px); background-size:25px 25px; }
.auth-showcase__logo { position:relative; z-index:10; align-self:flex-start; padding:9px 13px; border-radius:17px; background:white; box-shadow:0 14px 30px -18px rgba(31,18,47,.65); }
.auth-showcase__logo img { width:235px; height:auto; }
.auth-kicker { display:inline-flex; padding:6px 11px; border:1px solid rgba(255,255,255,.24); border-radius:999px; background:rgba(255,255,255,.11); font-size:10px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; }
.auth-showcase h1 { margin-top:18px; font-family:'Fredoka','Inter',system-ui,sans-serif; font-size:clamp(2.25rem,4vw,3.3rem); font-weight:700; line-height:1.02; letter-spacing:-.025em; }
.auth-showcase h1 span { color:#dfff7a; }
.auth-showcase p { max-width:450px; margin-top:17px; color:rgba(255,255,255,.78); font-size:14px; line-height:1.65; }
.auth-benefits { display:flex; flex-wrap:wrap; gap:8px; margin-top:24px; }
.auth-benefits div { display:inline-flex; align-items:center; gap:7px; padding:8px 10px; border:1px solid rgba(255,255,255,.14); border-radius:12px; background:rgba(255,255,255,.1); font-size:11px; }
.auth-mascot { position:absolute; right:38px; top:155px; z-index:3; width:92px; height:92px; border:1px solid rgba(255,255,255,.2); border-radius:31px; background:rgba(255,255,255,.12); transform:rotate(7deg); box-shadow:0 18px 35px -22px rgba(34,14,55,.7); }
.auth-mascot__book { display:grid; place-items:center; height:100%; font-size:48px; transform:rotate(-7deg); }
.auth-mascot__spark { position:absolute; top:-17px; right:-12px; color:#dfff7a; font-size:28px; }

.auth-form-panel { display:flex; min-width:0; flex-direction:column; padding:46px 46px 22px; background:rgba(255,255,255,.98); }
.auth-form-content { width:100%; max-width:390px; margin:auto; }
.auth-copyright { margin-top:20px; text-align:center; color:#b3a8b8; font-size:10px; }
.auth-mobile-logo { display:block; width:min(270px,82%); margin:0 auto 24px; padding:8px 10px; }
.auth-mobile-logo img { width:100%; height:auto; }

.animate-slide-in-up { animation:slideUp .5s cubic-bezier(.16,1,.3,1) forwards; }
@keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }

@media (max-width:767px) {
  .auth-shell { align-items:flex-start; padding:58px 12px 22px; overflow-y:auto; }
  .auth-back { position:absolute; top:12px; left:12px; background:transparent; border-color:transparent; }
  .auth-card { display:block; min-height:auto; border-radius:28px; box-shadow:0 24px 55px -35px rgba(62,35,83,.56); }
  .auth-form-panel { min-height:calc(100vh - 82px); padding:22px 20px 18px; border-top:4px solid transparent; border-image:linear-gradient(90deg,#00aebd,#9bd400,#ff5fa2,#7d4aa8) 1; }
  .auth-form-content { margin:0 auto; }
  .auth-doodle--star { top:4%; right:5%; left:auto; font-size:25px; }
  .auth-doodle--circle,.auth-doodle--plus { display:none; }
}
</style>
