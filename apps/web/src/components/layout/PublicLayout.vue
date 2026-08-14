<template>
  <div class="site-shell min-h-screen flex flex-col">

    <!-- Announcement Bar — visível em todos os tamanhos quando configurado -->
    <div
      v-if="config.announcementBarText"
      class="relative overflow-hidden text-white text-xs py-2 text-center font-semibold tracking-wide animate-slide-in-down"
      :style="{ background: config.announcementBarColor ? config.announcementBarColor : 'linear-gradient(90deg,#00aebd,#8fcf00,#ff5fa2,#7d4aa8)' }"
    >
      <!-- Brilho animado de varredura -->
      <span class="absolute inset-0 pointer-events-none announcement-shine" />
      <span class="relative">⚡ {{ config.announcementBarText }}</span>
    </div>

    <!-- Header -->
    <header
      class="brand-header sticky top-0 z-50 transition-all duration-300"
      :class="scrolled
        ? 'bg-white/90 backdrop-blur-xl shadow-md shadow-gray-200/60 border-b border-gray-100/80'
        : 'bg-white border-b border-gray-100'"
      style="padding-top: env(safe-area-inset-top)"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <!-- ── Linha principal: logo + busca + ações ── -->
        <div class="flex items-center justify-between h-[74px] sm:h-[86px] gap-3 sm:gap-6">

          <!-- Logo -->
          <RouterLink to="/" class="flex items-center gap-2 flex-shrink-0 group" aria-label="Início">
            <!-- Skeleton enquanto config não carregou -->
            <div v-if="!configLoaded" class="h-12 w-40 sm:w-56 bg-gray-100 animate-pulse rounded-xl"></div>
            <img
              v-else
              src="/site-pedagogico-logo.png"
              class="brand-logo h-[52px] sm:h-[66px] w-auto max-w-[58vw] object-contain transition-all duration-300 group-hover:scale-[1.02]"
              alt="Site Pedagógico — Materiais e conteúdos pedagógicos"
              fetchpriority="high"
              decoding="async"
            />
          </RouterLink>

          <!-- Busca (desktop) — mais larga e com sombra ao focar -->
          <div class="flex-1 max-w-lg hidden md:block">
            <div class="relative group">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar atividades pedagógicas..."
                class="brand-search w-full pl-11 pr-4 py-3 text-sm border rounded-2xl
                       bg-white hover:border-cyan-300
                       focus:outline-none focus:bg-white focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100/70
                       transition-all duration-200 placeholder:text-gray-400"
                @keyup.enter="doSearch"
              />
              <svg class="absolute left-4 top-3.5 w-4 h-4 text-gray-400 group-focus-within:text-cyan-600 transition-colors"
                fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
              </svg>
            </div>
          </div>

          <!-- Ações direita -->
          <div class="flex items-center gap-1.5">

            <!-- Entrar (desktop, não logado) -->
            <RouterLink
              v-if="!auth.isLoggedIn"
              to="/auth/login"
              class="brand-login hidden md:inline-flex items-center gap-1.5 text-sm font-bold text-white
                     px-4 py-2.5 rounded-xl transition-all duration-200 active:scale-95"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              Entrar
            </RouterLink>

            <!-- Avatar / menu (desktop, logado) -->
            <div v-if="auth.isLoggedIn" class="relative hidden md:block" ref="userMenuRef">
              <button
                @click="userMenuOpen = !userMenuOpen"
                class="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-gray-100
                       transition-all duration-200 active:scale-95"
                :aria-expanded="userMenuOpen"
                aria-haspopup="true"
              >
                <img
                  v-if="auth.user?.avatarUrl"
                  :src="auth.user.avatarUrl"
                  referrerpolicy="no-referrer"
                  @error="auth.user && (auth.user.avatarUrl = '')"
                  class="w-8 h-8 rounded-full ring-2 ring-violet-200 object-cover"
                />
                <div
                  v-else
                  class="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500
                         flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                >
                  {{ auth.user?.name?.[0]?.toUpperCase() }}
                </div>
                <span class="text-sm font-semibold text-gray-700 hidden lg:inline max-w-[100px] truncate">
                  {{ auth.user?.name?.split(' ')[0] }}
                </span>
                <svg class="w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform duration-200"
                  :class="{ 'rotate-180': userMenuOpen }"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              <!-- Dropdown -->
              <transition name="dropdown">
                <div
                  v-if="userMenuOpen"
                  class="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-1.5 z-50 overflow-hidden"
                >
                  <div class="px-4 py-2.5 border-b border-gray-100 mb-1">
                    <p class="text-sm font-bold text-gray-900 truncate">{{ auth.user?.name }}</p>
                    <p class="text-xs text-gray-400 truncate mt-0.5">{{ auth.user?.email }}</p>
                  </div>
                  <RouterLink to="/minha-conta/pedidos" class="flex items-center gap-2.5 px-4 py-2.5 text-gray-700 hover:bg-gray-50 text-sm transition-colors" @click="userMenuOpen = false">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                    Meus Pedidos
                  </RouterLink>
                  <RouterLink to="/minha-conta/downloads" class="flex items-center gap-2.5 px-4 py-2.5 text-gray-700 hover:bg-gray-50 text-sm transition-colors" @click="userMenuOpen = false">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    Downloads
                  </RouterLink>
                  <RouterLink v-if="auth.isAdmin" to="/admin" class="flex items-center gap-2.5 px-4 py-2.5 text-violet-600 hover:bg-violet-50 text-sm font-medium transition-colors" @click="userMenuOpen = false">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    Painel Admin
                  </RouterLink>
                  <hr class="my-1 border-gray-100" />
                  <button @click="handleLogout" class="flex items-center gap-2.5 px-4 py-2.5 text-red-500 hover:bg-red-50 text-sm w-full text-left transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                    Sair
                  </button>
                </div>
              </transition>
            </div>

            <!-- Hamburger (mobile) -->
            <button
              @click="mobileMenuOpen = !mobileMenuOpen"
              class="md:hidden w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-all active:scale-90"
              aria-label="Menu"
              :aria-expanded="mobileMenuOpen"
            >
              <transition name="icon-swap" mode="out-in">
                <svg v-if="!mobileMenuOpen" key="open" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg v-else key="close" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </transition>
            </button>
          </div>
        </div>

        <!-- Busca mobile — abaixo da linha principal -->
        <div
          class="brand-mobile-search-row md:hidden overflow-hidden transition-all duration-300 ease-out"
          :class="scrolled
            ? 'max-h-0 opacity-0 pb-0 pointer-events-none'
            : 'max-h-20 opacity-100 pb-2 pt-0.5'"
        >
          <div class="relative brand-mobile-search">
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Buscar atividades..."
              class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-2xl
                     bg-white focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100/70
                     placeholder:text-gray-400 transition-all"
              style="font-size: 16px;"
              @keyup.enter="doSearch"
            />
            <svg class="absolute left-3.5 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
            </svg>
          </div>
        </div>

        <!-- Nav desktop — com pill no item ativo -->
        <nav class="brand-nav hidden md:flex items-center justify-center gap-1 pb-2 border-t border-gray-100/70 pt-2">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200"
            :class="route.path === link.to || (link.to !== '/' && route.path.startsWith(link.to))
              ? 'brand-nav-active font-bold'
              : 'text-gray-500 hover:text-purple-700 hover:bg-purple-50/70'"
          >
            {{ link.label }}
          </RouterLink>
        </nav>

        <!-- Mobile menu -->
        <transition name="mobile-menu">
          <div v-if="mobileMenuOpen" class="md:hidden pb-4 border-t border-gray-100 pt-2 space-y-0.5">
            <RouterLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="flex items-center gap-2 py-3.5 px-3 text-gray-700 font-medium text-base
                     rounded-xl hover:bg-gray-50 transition-colors active:bg-gray-100"
              @click="mobileMenuOpen = false"
            >
              {{ link.label }}
            </RouterLink>
            <!-- Account actions -->
            <template v-if="auth.isLoggedIn">
              <hr class="my-1.5 border-gray-100" />
              <RouterLink
                to="/minha-conta/pedidos"
                class="flex items-center gap-2.5 py-3.5 px-3 text-gray-700 font-medium text-base
                       rounded-xl hover:bg-gray-50 transition-colors active:bg-gray-100"
                @click="mobileMenuOpen = false"
              >
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                Meus Pedidos
              </RouterLink>
              <RouterLink
                to="/minha-conta/downloads"
                class="flex items-center gap-2.5 py-3.5 px-3 text-gray-700 font-medium text-base
                       rounded-xl hover:bg-gray-50 transition-colors active:bg-gray-100"
                @click="mobileMenuOpen = false"
              >
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Downloads
              </RouterLink>
              <RouterLink
                v-if="auth.isAdmin"
                to="/admin"
                class="flex items-center gap-2.5 py-3.5 px-3 text-primary-600 font-medium text-base
                       rounded-xl hover:bg-primary-50 transition-colors active:bg-primary-100"
                @click="mobileMenuOpen = false"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Painel Admin
              </RouterLink>
              <button
                @click="handleLogout"
                class="flex items-center gap-2.5 py-3.5 px-3 text-red-500 font-medium text-base w-full text-left
                       rounded-xl hover:bg-red-50 transition-colors active:bg-red-100"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                Sair
              </button>
            </template>
            <RouterLink
              v-else
              to="/auth/login"
              class="flex items-center gap-2.5 py-3.5 px-3 text-primary-600 font-medium text-base
                     rounded-xl hover:bg-primary-50 transition-colors active:bg-primary-100"
              @click="mobileMenuOpen = false"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              Entrar / Criar conta
            </RouterLink>
          </div>
        </transition>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1 pb-[68px] md:pb-0">
      <RouterView />
    </main>

    <!-- Trust Badges -->
    <section class="bg-gray-50 border-t border-gray-100 py-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            v-for="badge in trustBadges"
            :key="badge.label"
            :data-track="badge.track || undefined"
            class="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm
                   hover:shadow-md transition-shadow duration-300 group"
          >
            <div
              class="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0
                     group-hover:scale-110 transition-transform duration-300"
              :class="badge.bg"
            >
              <component :is="badge.icon" class="w-7 h-7" :class="badge.color" />
            </div>
            <div>
              <p class="font-bold text-gray-800 text-sm">{{ badge.label }}</p>
              <p class="text-xs text-gray-500 mt-0.5">{{ badge.sub }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="brand-footer text-white pt-12 pb-24 md:pb-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">

          <!-- Brand -->
          <div>
            <RouterLink to="/" class="inline-flex items-center gap-2 mb-4 bg-white rounded-2xl px-3 py-2 shadow-lg hover:-translate-y-0.5 transition-all">
              <img src="/site-pedagogico-logo.png" class="h-12 w-auto max-w-[220px] object-contain" alt="Site Pedagógico" />
            </RouterLink>
            <p class="text-purple-300 text-sm mb-4 leading-relaxed">{{ config.storeDescription }}</p>
            <div class="flex items-center gap-3 flex-wrap">
              <a
                v-if="config.socialLinks?.instagram"
                :href="config.socialLinks.instagram"
                target="_blank" rel="noopener"
                data-track="instagram"
                class="inline-flex items-center gap-1.5 text-purple-300 hover:text-white text-sm transition-colors group"
              >
                <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram
              </a>
              <a
                v-if="config.socialLinks?.tiktok"
                :href="config.socialLinks.tiktok"
                target="_blank" rel="noopener"
                class="inline-flex items-center gap-1.5 text-purple-300 hover:text-white text-sm transition-colors group"
              >
                <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
                TikTok
              </a>
            </div>
          </div>

          <!-- Navegação -->
          <div>
            <h4 class="font-bold text-white mb-4 text-xs uppercase tracking-widest">Navegação</h4>
            <ul class="space-y-2.5">
              <li><RouterLink to="/" class="text-purple-300 hover:text-white text-sm transition-colors">Início</RouterLink></li>
              <li><RouterLink to="/catalogo" class="text-purple-300 hover:text-white text-sm transition-colors">Todas as atividades</RouterLink></li>
              <li><RouterLink to="/catalogo?gratis=1" class="text-purple-300 hover:text-white text-sm transition-colors">Atividades grátis</RouterLink></li>
              <li><RouterLink to="/quem-somos" class="text-purple-300 hover:text-white text-sm transition-colors">Quem somos</RouterLink></li>
            </ul>
          </div>

          <!-- Ajuda -->
          <div>
            <h4 class="font-bold text-white mb-4 text-xs uppercase tracking-widest">Ajuda</h4>
            <ul class="space-y-2.5">
              <li v-if="config.socialLinks?.whatsapp">
                <a :href="`https://wa.me/${config.socialLinks.whatsapp}`" target="_blank"
                  data-track="whatsapp"
                  class="flex items-center gap-2 text-purple-300 hover:text-white text-sm transition-colors group">
                  <svg class="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Suporte no WhatsApp
                </a>
              </li>
              <li><RouterLink to="/contato" class="text-purple-300 hover:text-white text-sm transition-colors">Fale conosco</RouterLink></li>
              <li><RouterLink to="/minha-conta/downloads" class="text-purple-300 hover:text-white text-sm transition-colors">Meus downloads</RouterLink></li>
              <li><RouterLink to="/politica-privacidade" class="text-purple-300 hover:text-white text-sm transition-colors">Política de privacidade</RouterLink></li>
            </ul>
          </div>

          <!-- Pagamento & Segurança -->
          <div>
            <h4 class="font-bold text-white mb-4 text-xs uppercase tracking-widest">Pague com segurança</h4>
            <div class="flex flex-wrap gap-2 mb-4">
              <span v-for="m in ['PIX','Visa','Master','Elo']" :key="m"
                class="text-[11px] font-bold text-purple-200 bg-white/10 px-2.5 py-1 rounded-lg">{{ m }}</span>
            </div>
            <div class="flex items-center gap-2 text-purple-300 text-xs">
              <svg class="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              Compra protegida pelo Mercado Pago
            </div>
            <div class="flex items-center gap-2 text-purple-300 text-xs mt-2">
              <svg class="w-4 h-4 text-violet-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              Entrega imediata do PDF
            </div>
          </div>
        </div>

        <div class="border-t border-purple-800/60 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p class="text-purple-400 text-xs">{{ config.footerText || `© 2026 ${config.storeName}. Todos os direitos reservados.` }}</p>
          <p class="text-purple-600 text-xs">Feito com ❤️ para educadores</p>
        </div>
      </div>
    </footer>

    <!-- Cart Drawer -->
    <CartDrawer v-if="cart.isOpen" @close="cart.closeCart()" />

    <!-- Cart FAB — pílula flutuante (mobile, quando há itens) -->
    <CartFab />

    <!-- WhatsApp floating widget — visível para todos -->
    <WhatsAppWidget v-if="config.socialLinks?.whatsapp" />

    <!-- Crédito discreto da agência -->
    <AlivenCredit v-if="!scrolled" />

    <!-- Scroll to top button -->
    <transition name="fade">
      <button
        v-if="scrolled"
        @click="scrollToTop"
        class="hidden md:flex fixed bottom-6 right-[88px] w-11 h-11 bg-primary-600 hover:bg-primary-700 text-white
               rounded-full shadow-lg hover:shadow-xl transition-all duration-200 active:scale-90
               items-center justify-center z-40"
        aria-label="Voltar ao topo"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
        </svg>
      </button>
    </transition>

    <!-- ── Bottom navigation (mobile only) ──────────────── -->
    <nav class="brand-mobile-nav md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t flex items-stretch"
      style="padding-bottom: env(safe-area-inset-bottom);">
      <RouterLink to="/" class="mobile-nav-item flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors"
        :class="route.path === '/' ? 'mobile-nav-active' : 'text-gray-400'">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        <span class="text-[10px] font-semibold">Início</span>
      </RouterLink>
      <RouterLink to="/catalogo" class="mobile-nav-item flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors"
        :class="route.path.startsWith('/catalogo') ? 'mobile-nav-active' : 'text-gray-400'">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <span class="text-[10px] font-semibold">Buscar</span>
      </RouterLink>
      <button @click="cart.openCart()" class="mobile-nav-item mobile-cart-item flex-1 flex flex-col items-center justify-center gap-1 py-2 text-gray-400 transition-colors relative">
        <span class="relative">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          <span v-if="cart.count > 0" class="absolute -top-1.5 -right-2 bg-primary-600 text-white text-[9px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">{{ cart.count }}</span>
        </span>
        <span class="text-[10px] font-semibold">Carrinho</span>
      </button>
      <RouterLink :to="auth.isLoggedIn ? '/minha-conta/pedidos' : '/auth/login'"
        class="mobile-nav-item flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors"
        :class="route.path.startsWith('/minha-conta/pedidos') ? 'mobile-nav-active' : 'text-gray-400'">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        <span class="text-[10px] font-semibold">Pedidos</span>
      </RouterLink>
      <RouterLink :to="auth.isLoggedIn ? '/minha-conta/downloads' : '/auth/login'"
        class="mobile-nav-item flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors"
        :class="(route.path.startsWith('/minha-conta/downloads') || route.path.startsWith('/auth')) ? 'mobile-nav-active' : 'text-gray-400'">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        <span class="text-[10px] font-semibold">Conta</span>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, h } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { useSiteConfigStore } from '@/stores/site-config.store';
import { useCartStore } from '@/stores/cart.store';
import { defineAsyncComponent } from 'vue';
const CartDrawer = defineAsyncComponent(() => import('@/components/catalog/CartDrawer.vue'));
const CartFab = defineAsyncComponent(() => import('@/components/catalog/CartFab.vue'));
const WhatsAppWidget = defineAsyncComponent(() => import('@/components/common/WhatsAppWidget.vue'));
const AlivenCredit = defineAsyncComponent(() => import('@/components/common/AlivenCredit.vue'));

const auth = useAuthStore();
const siteConfigStore = useSiteConfigStore();
const cart = useCartStore();
const router = useRouter();
const route = useRoute();

const { config, loaded: configLoaded } = storeToRefs(siteConfigStore);
const userMenuOpen = ref(false);
const mobileMenuOpen = ref(false);
const searchQuery = ref('');
const scrolled = ref(false);

const navLinks = [
  { to: '/', label: 'Início' },
  { to: '/catalogo', label: 'Produtos' },
  { to: '/quem-somos', label: 'Quem Somos' },
  { to: '/contato', label: 'Contato' },
];


// Trust badge icons as render functions to avoid extra imports
const ChatIcon = { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', class: 'w-7 h-7' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' })
]) };

const CardIcon = { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', class: 'w-7 h-7' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' })
]) };

const PrintIcon = { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', class: 'w-7 h-7' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z' })
]) };

const trustBadges = [
  { label: 'TIRAR DÚVIDAS!', sub: 'Atendimento via WhatsApp', icon: ChatIcon, bg: 'bg-purple-100', color: 'text-primary-600', track: 'cta' },
  { label: 'Pague Como Quiser', sub: 'PIX, cartão e muito mais', icon: CardIcon, bg: 'bg-green-100', color: 'text-green-600' },
  { label: 'Atividades prontas para imprimir', sub: 'Download disponível na conta', icon: PrintIcon, bg: 'bg-blue-100', color: 'text-blue-600' },
];

function doSearch() {
  if (searchQuery.value.trim()) {
    router.push(`/catalogo?busca=${encodeURIComponent(searchQuery.value.trim())}`);
    mobileMenuOpen.value = false;
    searchQuery.value = '';
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleScroll() {
  scrolled.value = window.scrollY > 40;
}

async function handleLogout() {
  userMenuOpen.value = false;
  await auth.logout();
  router.push('/');
}

// Close user menu on outside click
function onClickOutside(e: MouseEvent) {
  const el = document.querySelector('[data-user-menu]');
  if (el && !el.contains(e.target as Node)) userMenuOpen.value = false;
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  document.addEventListener('click', onClickOutside);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  document.removeEventListener('click', onClickOutside);
});
</script>

<style scoped>
.site-shell {
  --brand-cyan: #00aebd;
  --brand-pink: #ff5fa2;
  --brand-lime: #9bd400;
  --brand-purple: #7d4aa8;
  background:
    radial-gradient(circle at 3% 14%, rgba(0, 174, 189, 0.055), transparent 22rem),
    radial-gradient(circle at 97% 38%, rgba(255, 95, 162, 0.05), transparent 24rem),
    #fffefe;
}

.brand-header::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: linear-gradient(90deg, var(--brand-cyan) 0 25%, var(--brand-pink) 25% 50%, var(--brand-purple) 50% 75%, var(--brand-lime) 75%);
}

.brand-logo {
  filter: drop-shadow(0 5px 12px rgba(86, 50, 126, 0.08));
}

.brand-search {
  border-color: rgba(0, 174, 189, 0.18);
  box-shadow: 0 8px 24px -18px rgba(86, 50, 126, 0.45);
}

.brand-login {
  background: linear-gradient(135deg, #8a58b3, #f05a9b);
  box-shadow: 0 8px 18px -8px rgba(125, 74, 168, 0.7);
}

.brand-login:hover {
  transform: translateY(-1px);
  box-shadow: 0 11px 22px -8px rgba(240, 90, 155, 0.65);
}

.brand-nav-active {
  color: #68408d;
  background: linear-gradient(135deg, rgba(0, 174, 189, 0.1), rgba(255, 95, 162, 0.11));
  box-shadow: inset 0 0 0 1px rgba(125, 74, 168, 0.08);
}

.brand-mobile-search::after {
  content: '';
  position: absolute;
  left: 12%;
  right: 12%;
  bottom: -1px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 174, 189, 0.5), rgba(255, 95, 162, 0.45), transparent);
}

.brand-footer {
  background:
    radial-gradient(circle at 12% 8%, rgba(0, 174, 189, 0.16), transparent 28rem),
    radial-gradient(circle at 88% 92%, rgba(255, 95, 162, 0.13), transparent 30rem),
    linear-gradient(145deg, #241241, #321854 58%, #1f1438);
  border-top: 4px solid transparent;
  border-image: linear-gradient(90deg, #00aebd, #9bd400, #ff5fa2, #7d4aa8) 1;
}

.brand-mobile-nav {
  min-height: 64px;
  border-color: rgba(125, 74, 168, 0.12);
  box-shadow: 0 -10px 28px -18px rgba(72, 43, 98, 0.35);
}

.mobile-nav-item {
  position: relative;
  min-height: 62px;
  -webkit-tap-highlight-color: transparent;
}

.mobile-nav-item::before {
  content: '';
  position: absolute;
  top: 5px;
  width: 36px;
  height: 30px;
  border-radius: 13px;
  opacity: 0;
  transform: scale(0.75);
  background: linear-gradient(135deg, rgba(0, 174, 189, 0.12), rgba(255, 95, 162, 0.13));
  transition: opacity 180ms ease, transform 180ms ease;
}

.mobile-nav-item > svg,
.mobile-nav-item > span,
.mobile-nav-item > span > svg {
  position: relative;
  z-index: 1;
}

.mobile-nav-active {
  color: #7d4aa8;
}

.mobile-nav-active::before {
  opacity: 1;
  transform: scale(1);
}

.mobile-cart-item svg {
  color: #ef5d9d;
}

@media (max-width: 767px) {
  .brand-header .brand-logo {
    height: 41px;
    max-width: 66vw;
  }

  .brand-header > div > div:first-child {
    height: 58px;
  }

  .brand-header {
    box-shadow: 0 8px 24px -22px rgba(72, 43, 98, 0.48);
  }

  .brand-mobile-search-row {
    will-change: max-height, opacity;
  }

  .brand-mobile-nav {
    min-height: 60px;
  }

  .mobile-nav-item {
    min-height: 58px;
    padding-top: 6px;
    padding-bottom: 6px;
  }

  .mobile-nav-item > svg,
  .mobile-nav-item > span > svg {
    width: 22px;
    height: 22px;
  }
}

/* Announcement bar shine */
.announcement-shine {
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%);
  animation: shine 3s ease-in-out infinite;
}
@keyframes shine {
  0%   { transform: translateX(-100%); }
  60%  { transform: translateX(100%); }
  100% { transform: translateX(100%); }
}

/* Dropdown transition */
.dropdown-enter-active { animation: slide-in-down 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.dropdown-leave-active { animation: slide-in-down 0.15s cubic-bezier(0.16, 1, 0.3, 1) reverse; }

/* Mobile menu transition */
.mobile-menu-enter-active { animation: slide-in-down 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.mobile-menu-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.mobile-menu-leave-to { opacity: 0; transform: translateY(-8px); }

/* Badge transition */
.badge-enter-active { animation: bounce-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.badge-leave-active { transition: all 0.15s ease; }
.badge-leave-to { opacity: 0; transform: scale(0.5); }

/* Icon swap */
.icon-swap-enter-active { animation: fade-in 0.15s ease; }
.icon-swap-leave-active { transition: opacity 0.1s ease; }
.icon-swap-leave-to { opacity: 0; }

/* Fade for scroll-to-top */
.fade-enter-active { animation: fade-in 0.25s ease; }
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-leave-to { opacity: 0; }

@keyframes slide-in-down {
  from { transform: translateY(-10px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}
@keyframes bounce-in {
  0%   { transform: scale(0.3); opacity: 0; }
  60%  { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* WhatsApp popup */
.modal-pop-enter-active { animation: modal-pop-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-pop-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.modal-pop-leave-to { opacity: 0; transform: scale(0.95); }
@keyframes modal-pop-in {
  from { opacity: 0; transform: scale(0.88) translateY(16px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
