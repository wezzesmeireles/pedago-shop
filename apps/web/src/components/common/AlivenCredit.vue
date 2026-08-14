<template>
  <Teleport to="body">
    <a
      class="aliven-credit"
      href="https://www.aliven.digital"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Site desenvolvido por Aliven Digital (abre em uma nova aba)"
      data-track="aliven-credit"
    >
      <span class="aliven-credit__mark" aria-hidden="true">
        <span class="aliven-credit__orbit" />
        <img
          class="aliven-credit__logo"
          src="https://www.aliven.digital/assets/favicon.png"
          alt=""
          width="28"
          height="28"
          loading="lazy"
          decoding="async"
        />
      </span>

      <span class="aliven-credit__copy">
        <span class="aliven-credit__eyebrow"><span class="aliven-credit__status" /> Site desenvolvido por</span>
        <span class="aliven-credit__brand">ALIVEN</span>
      </span>

      <svg class="aliven-credit__arrow" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M6 14 14 6m0 0H8m6 0v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </a>
  </Teleport>
</template>

<style scoped>
.aliven-credit {
  position: fixed;
  left: 18px;
  bottom: calc(76px + env(safe-area-inset-bottom, 0px));
  z-index: 39;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 50px;
  padding: 7px 11px 7px 7px;
  color: #fff;
  background:
    radial-gradient(circle at 18% 20%, rgba(37, 99, 235, 0.2), transparent 38%),
    rgba(1, 3, 20, 0.94);
  border: 1px solid rgba(59, 130, 246, 0.32);
  border-radius: 14px;
  box-shadow: 0 10px 28px -10px rgba(1, 3, 20, 0.72), 0 0 20px -10px rgba(59, 130, 246, 0.9);
  backdrop-filter: blur(16px) saturate(1.2);
  -webkit-backdrop-filter: blur(16px) saturate(1.2);
  font-family: 'Space Grotesk', 'Manrope', Inter, system-ui, sans-serif;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1),
              border-color 220ms ease,
              box-shadow 220ms ease;
}

.aliven-credit:hover,
.aliven-credit:focus-visible {
  transform: translateY(-3px);
  border-color: rgba(96, 165, 250, 0.68);
  box-shadow: 0 14px 34px -10px rgba(1, 3, 20, 0.82), 0 0 26px -8px rgba(59, 130, 246, 0.9);
}

.aliven-credit::before {
  content: '';
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  background: linear-gradient(100deg, transparent 20%, rgba(96, 165, 250, 0.14) 48%, transparent 76%);
  background-size: 220% 100%;
  animation: aliven-scan 4.2s ease-in-out infinite;
  pointer-events: none;
}

.aliven-credit__mark {
  position: relative;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.68);
  box-shadow: inset 0 0 14px rgba(37, 99, 235, 0.11);
}

.aliven-credit__orbit {
  position: absolute;
  inset: 3px;
  border: 1px solid transparent;
  border-top-color: rgba(96, 165, 250, 0.72);
  border-right-color: rgba(37, 99, 235, 0.22);
  border-radius: 8px;
  animation: aliven-orbit 5s linear infinite;
}

.aliven-credit__logo {
  position: relative;
  z-index: 1;
  width: 28px;
  height: 28px;
  object-fit: contain;
  filter: drop-shadow(0 0 7px rgba(59, 130, 246, 0.52));
}

.aliven-credit__copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.05;
}

.aliven-credit__eyebrow {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #94a3b8;
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.aliven-credit__status {
  width: 4px;
  height: 4px;
  flex: 0 0 auto;
  border-radius: 999px;
  background: #3b82f6;
  box-shadow: 0 0 7px #3b82f6;
  animation: aliven-status 2s ease-in-out infinite;
}

.aliven-credit__brand {
  margin-top: 3px;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.16em;
  white-space: nowrap;
}

.aliven-credit__arrow {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
  color: #60a5fa;
  transition: color 180ms ease, transform 180ms ease;
}

.aliven-credit:hover .aliven-credit__arrow,
.aliven-credit:focus-visible .aliven-credit__arrow {
  color: #fff;
  transform: translate(2px, -2px);
}

@media (max-width: 767px) {
  .aliven-credit {
    left: 9px;
    bottom: calc(68px + env(safe-area-inset-bottom, 0px));
    width: 36px;
    height: 36px;
    min-height: 36px;
    padding: 3px;
    border-radius: 13px;
    justify-content: center;
    opacity: 0.88;
    box-shadow: 0 8px 22px -10px rgba(1, 3, 20, 0.78), 0 0 16px -9px rgba(59, 130, 246, 0.9);
  }

  .aliven-credit__mark {
    width: 28px;
    height: 28px;
  }

  .aliven-credit__logo {
    width: 22px;
    height: 22px;
  }

  .aliven-credit__copy,
  .aliven-credit__arrow {
    display: none;
  }
}

@media (min-width: 768px) {
  .aliven-credit {
    left: 24px;
    bottom: 24px;
    z-index: 40;
  }
}

@keyframes aliven-scan {
  0%, 28% { background-position: 160% 0; }
  70%, 100% { background-position: -80% 0; }
}

@keyframes aliven-orbit {
  to { transform: rotate(360deg); }
}

@keyframes aliven-status {
  0%, 100% { opacity: 0.45; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .aliven-credit,
  .aliven-credit::before,
  .aliven-credit__orbit,
  .aliven-credit__status,
  .aliven-credit__arrow {
    animation: none;
    transition: none;
  }
}
</style>
