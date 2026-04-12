<template>
  <div class="min-h-screen flex flex-col bg-white">

    <!-- Announcement Bar -->
    <div
      v-if="config.announcementBarText"
      class="text-white text-xs py-1.5 text-center font-semibold tracking-wider uppercase animate-slide-in-down"
      :style="{ backgroundColor: config.announcementBarColor || '#9333ea' }"
    >
      {{ config.announcementBarText }}
    </div>

    <!-- Header -->
    <header
      class="bg-white sticky top-0 z-50 transition-all duration-300"
      :class="scrolled ? 'shadow-lg' : 'border-b border-gray-100'"
    >
      <!-- Blur overlay when scrolled -->
      <div
        v-if="scrolled"
        class="absolute inset-0 glass -z-10 border-b border-gray-200/60"
      />

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-24 gap-4">

          <!-- Search -->
          <div class="flex-1 max-w-xs hidden md:block">
            <div class="relative group">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="O que está buscando?"
                class="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-full
                       focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100
                       bg-gray-50 hover:bg-white hover:border-gray-300
                       transition-all duration-200 placeholder:text-gray-400"
                @keyup.enter="doSearch"
              />
              <svg
                class="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
              </svg>
            </div>
          </div>

          <!-- Logo -->
          <RouterLink
            to="/"
            class="flex items-center gap-2 flex-shrink-0 group"
          >
            <img
              v-if="config.logoUrl"
              :src="config.logoUrl"
              class="h-24 w-auto drop-shadow-md group-hover:drop-shadow-lg group-hover:scale-[1.04] transition-all duration-200"
              :alt="config.storeName"
            />
            <span
              v-else
              class="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-purple-600
                     text-white font-extrabold text-lg px-4 py-1.5 rounded-xl shadow-md
                     group-hover:shadow-violet-400/50 group-hover:scale-[1.04]
                     transition-all duration-200 tracking-tight"
            >
              <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              {{ config.storeName }}
            </span>
          </RouterLink>

          <!-- Right actions -->
          <div class="flex items-center gap-1 flex-1 justify-end">

            <!-- Meus Pedidos (mobile, logged in) -->
            <RouterLink
              v-if="auth.isLoggedIn"
              to="/minha-conta/pedidos"
              class="sm:hidden inline-flex items-center gap-1.5 text-sm font-semibold text-white
                     bg-primary-600 hover:bg-primary-700 px-3 py-2 rounded-xl transition-all duration-200 active:scale-95"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
              Meus Pedidos
            </RouterLink>

            <!-- Cart -->
            <button
              @click="openCart"
              class="relative p-2.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50
                     rounded-full transition-all duration-200 active:scale-90"
              aria-label="Carrinho"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-9H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <transition name="badge">
                <span
                  v-if="cart.count > 0"
                  :key="cart.count"
                  class="absolute -top-0.5 -right-0.5 bg-green-500 text-white text-[10px] rounded-full
                         w-5 h-5 flex items-center justify-center font-bold shadow animate-bounce-in"
                >
                  {{ cart.count }}
                </span>
              </transition>
            </button>

            <!-- Meus Pedidos (desktop, logged in) -->
            <RouterLink
              v-if="auth.isLoggedIn"
              to="/minha-conta/pedidos"
              class="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-gray-600
                     hover:text-primary-600 px-3 py-2 rounded-xl hover:bg-primary-50 transition-all"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
              Meus Pedidos
            </RouterLink>

            <!-- User menu -->
            <template v-if="auth.isLoggedIn">
              <div class="relative" ref="userMenuRef">
                <button
                  @click="userMenuOpen = !userMenuOpen"
                  class="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors active:scale-95"
                >
                  <img v-if="auth.user?.avatarUrl" :src="auth.user.avatarUrl" class="w-8 h-8 rounded-full ring-2 ring-primary-200" />
                  <div
                    v-else
                    class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500
                           flex items-center justify-center text-white font-bold text-sm shadow"
                  >
                    {{ auth.user?.name?.[0]?.toUpperCase() }}
                  </div>
                </button>

                <transition name="dropdown">
                  <div
                    v-if="userMenuOpen"
                    class="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl
                           border border-gray-100 py-1.5 z-50 overflow-hidden"
                  >
                    <div class="px-4 py-2 border-b border-gray-100 mb-1">
                      <p class="text-xs font-semibold text-gray-800 truncate">{{ auth.user?.name }}</p>
                      <p class="text-xs text-gray-400 truncate">{{ auth.user?.email }}</p>
                    </div>
                    <RouterLink to="/minha-conta/pedidos" class="flex items-center gap-2.5 px-4 py-2 text-gray-700 hover:bg-gray-50 text-sm transition-colors" @click="userMenuOpen = false">
                      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                      Meus Pedidos
                    </RouterLink>
                    <RouterLink to="/minha-conta/downloads" class="flex items-center gap-2.5 px-4 py-2 text-gray-700 hover:bg-gray-50 text-sm transition-colors" @click="userMenuOpen = false">
                      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                      Downloads
                    </RouterLink>
                    <RouterLink v-if="auth.isAdmin" to="/admin" class="flex items-center gap-2.5 px-4 py-2 text-primary-600 hover:bg-primary-50 text-sm font-medium transition-colors" @click="userMenuOpen = false">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      Painel Admin
                    </RouterLink>
                    <hr class="my-1 border-gray-100" />
                    <button @click="handleLogout" class="flex items-center gap-2.5 px-4 py-2 text-red-500 hover:bg-red-50 text-sm w-full text-left transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                      Sair
                    </button>
                  </div>
                </transition>
              </div>
            </template>

            <template v-else>
              <RouterLink
                to="/auth/login"
                class="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-primary-600
                       hover:text-primary-700 px-3 py-2 rounded-xl hover:bg-primary-50 transition-all"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                Entrar
              </RouterLink>
            </template>

            <!-- Mobile toggle -->
            <button
              @click="mobileMenuOpen = !mobileMenuOpen"
              class="md:hidden p-2.5 text-gray-600 hover:bg-gray-100 rounded-full transition-all active:scale-90"
              aria-label="Menu"
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

        <!-- Desktop navigation bar -->
        <nav class="hidden md:flex items-center justify-center gap-1 py-1.5 border-t border-gray-50">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="relative px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-primary-600
                   rounded-lg hover:bg-primary-50 transition-all duration-200 group"
            active-class="text-primary-600 bg-primary-50"
          >
            {{ link.label }}
            <span class="absolute bottom-0.5 left-3 right-3 h-0.5 bg-primary-500 rounded-full scale-x-0
                         group-hover:scale-x-100 transition-transform duration-200 origin-left"></span>
          </RouterLink>
        </nav>

        <!-- Mobile menu -->
        <transition name="mobile-menu">
          <div v-if="mobileMenuOpen" class="md:hidden pb-4 border-t border-gray-100 pt-3 space-y-1">
            <div class="mb-3">
              <div class="relative">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="O que está buscando?"
                  class="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl
                         focus:outline-none focus:border-primary-400 bg-gray-50"
                  @keyup.enter="doSearch"
                />
                <svg class="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
                </svg>
              </div>
            </div>
            <RouterLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="flex items-center gap-2 py-2.5 px-3 text-gray-700 font-medium text-sm
                     rounded-xl hover:bg-gray-50 transition-colors"
              @click="mobileMenuOpen = false"
            >
              {{ link.label }}
            </RouterLink>
            <RouterLink
              v-if="auth.isLoggedIn"
              to="/minha-conta/pedidos"
              class="flex items-center gap-2 py-2.5 px-3 text-primary-600 font-medium text-sm
                     rounded-xl hover:bg-primary-50 transition-colors"
              @click="mobileMenuOpen = false"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
              Meus Pedidos
            </RouterLink>
          </div>
        </transition>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1">
      <RouterView v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>

    <!-- Trust Badges -->
    <section class="bg-gray-50 border-t border-gray-100 py-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="(badge, i) in trustBadges"
            :key="badge.label"
            class="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm
                   hover:shadow-md transition-shadow duration-300 group"
            :class="`reveal reveal-delay-${i + 1}`"
            ref="badgeRefs"
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
    <footer style="background-color: #2d1b69;" class="text-white pt-12 pb-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">

          <!-- Brand -->
          <div>
            <RouterLink to="/" class="inline-flex items-center gap-2 mb-4 hover:opacity-90 transition-opacity">
              <img v-if="config.logoUrl" :src="config.logoUrl" class="h-10 w-auto" :alt="config.storeName" />
              <span v-else class="text-lg font-bold text-white">{{ config.storeName }}</span>
            </RouterLink>
            <p class="text-purple-300 text-sm mb-4 leading-relaxed">{{ config.storeDescription }}</p>
            <div class="flex items-center gap-3 flex-wrap">
              <a
                v-if="config.socialLinks?.instagram"
                :href="config.socialLinks.instagram"
                target="_blank" rel="noopener"
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

          <!-- Departamentos -->
          <div>
            <h4 class="font-bold text-white mb-4 text-xs uppercase tracking-widest">Departamentos</h4>
            <ul class="space-y-2.5">
              <li v-for="dept in departments" :key="dept.label">
                <RouterLink
                  :to="dept.to"
                  class="text-purple-300 hover:text-white text-sm transition-colors
                         inline-flex items-center gap-1.5 group"
                >
                  <span class="w-1 h-1 rounded-full bg-purple-500 group-hover:bg-purple-300 transition-colors"></span>
                  {{ dept.label }}
                </RouterLink>
              </li>
            </ul>
          </div>

          <!-- Contato -->
          <div>
            <h4 class="font-bold text-white mb-4 text-xs uppercase tracking-widest">Entre em contato</h4>
            <ul class="space-y-2.5">
              <li v-if="config.socialLinks?.whatsapp">
                <a :href="`https://wa.me/${config.socialLinks.whatsapp}`" target="_blank"
                  class="flex items-center gap-2 text-purple-300 hover:text-white text-sm transition-colors group">
                  <svg class="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
              </li>
              <li v-if="config.socialLinks?.tiktok">
                <a :href="config.socialLinks.tiktok" target="_blank"
                  class="flex items-center gap-2 text-purple-300 hover:text-white text-sm transition-colors group">
                  <svg class="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                  TikTok
                </a>
              </li>
              <li>
                <RouterLink to="/contato" class="text-purple-300 hover:text-white text-sm transition-colors">Fale Conosco</RouterLink>
              </li>
              <li>
                <RouterLink to="/politica-privacidade" class="text-purple-300 hover:text-white text-sm transition-colors">Política de Privacidade</RouterLink>
              </li>
              <li>
                <RouterLink to="/quem-somos" class="text-purple-300 hover:text-white text-sm transition-colors">Quem Somos</RouterLink>
              </li>
            </ul>
          </div>

          <!-- Newsletter -->
          <div>
            <h4 class="font-bold text-white mb-4 text-xs uppercase tracking-widest">Newsletter</h4>
            <p class="text-purple-300 text-sm mb-3 leading-relaxed">Receba promoções e novidades exclusivas no seu email.</p>
            <form @submit.prevent="subscribeNewsletter" class="space-y-2">
              <input
                v-model="newsletterEmail"
                type="email"
                placeholder="Seu melhor e-mail"
                required
                class="w-full px-3.5 py-2.5 rounded-xl text-sm text-gray-800
                       focus:outline-none focus:ring-2 focus:ring-purple-400
                       bg-white placeholder:text-gray-400 transition-all"
              />
              <button
                type="submit"
                class="w-full bg-purple-500 hover:bg-purple-400 active:scale-95 text-white
                       font-semibold text-sm px-4 py-2.5 rounded-xl transition-all duration-200 shadow"
              >
                <span v-if="!newsletterSent">Enviar</span>
                <span v-else class="flex items-center justify-center gap-1.5">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                  Cadastrado!
                </span>
              </button>
            </form>
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

    <!-- WhatsApp floating button -->
    <a
      v-if="config.socialLinks?.whatsapp"
      :href="`https://wa.me/${config.socialLinks.whatsapp}?text=${encodeURIComponent('Olá, *Site Pedagógico*! 👋\n\nVim pelo site e gostaria de ajuda.\n\nPoderia me atender? 😊')}`"
      target="_blank"
      rel="noopener"
      class="fixed bottom-20 right-6 flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20c05c]
             text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200
             active:scale-95 z-40 group px-4 py-3"
      aria-label="Falar no WhatsApp"
    >
      <img
        v-if="config.faviconUrl"
        :src="config.faviconUrl"
        :alt="config.storeName"
        class="w-7 h-7 rounded-full object-contain flex-shrink-0"
      />
      <svg v-else class="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      <span class="text-sm font-semibold leading-none">Suporte</span>
    </a>

    <!-- Scroll to top button -->
    <transition name="fade">
      <button
        v-if="scrolled"
        @click="scrollToTop"
        class="fixed bottom-6 right-6 w-11 h-11 bg-primary-600 hover:bg-primary-700 text-white
               rounded-full shadow-lg hover:shadow-xl transition-all duration-200 active:scale-90
               flex items-center justify-center z-40"
        aria-label="Voltar ao topo"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
        </svg>
      </button>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, h } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { useSiteConfigStore } from '@/stores/site-config.store';
import { useCartStore } from '@/stores/cart.store';
import CartDrawer from '@/components/catalog/CartDrawer.vue';

const auth = useAuthStore();
const siteConfigStore = useSiteConfigStore();
const cart = useCartStore();
const router = useRouter();

const { config } = storeToRefs(siteConfigStore);
const userMenuOpen = ref(false);
const mobileMenuOpen = ref(false);
const searchQuery = ref('');
const newsletterEmail = ref('');
const newsletterSent = ref(false);
const scrolled = ref(false);

const navLinks = [
  { to: '/', label: 'Início' },
  { to: '/catalogo', label: 'Produtos' },
  { to: '/contato', label: 'Contato' },
  { to: '/politica-privacidade', label: 'Política de Privacidade' },
  { to: '/quem-somos', label: 'Quem Somos' },
];

const departments = [
  { to: '/catalogo', label: 'Todas as Atividades' },
  { to: '/catalogo?categoria=alfabetizacao', label: 'Alfabetização' },
  { to: '/catalogo?categoria=matematica', label: 'Matemática' },
  { to: '/catalogo?categoria=ciencias', label: 'Ciências' },
  { to: '/catalogo?categoria=artes', label: 'Artes' },
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
  { label: 'TIRAR DÚVIDAS!', sub: 'Atendimento via WhatsApp', icon: ChatIcon, bg: 'bg-purple-100', color: 'text-primary-600' },
  { label: 'Pague Como Quiser', sub: 'PIX, cartão e muito mais', icon: CardIcon, bg: 'bg-green-100', color: 'text-green-600' },
  { label: 'Atividades prontas para imprimir', sub: 'PDF entregue no seu email', icon: PrintIcon, bg: 'bg-blue-100', color: 'text-blue-600' },
];

function openCart() {
  cart.openCart();
}

function doSearch() {
  if (searchQuery.value.trim()) {
    router.push(`/catalogo?busca=${encodeURIComponent(searchQuery.value.trim())}`);
    mobileMenuOpen.value = false;
    searchQuery.value = '';
  }
}

function subscribeNewsletter() {
  newsletterSent.value = true;
  newsletterEmail.value = '';
  setTimeout(() => { newsletterSent.value = false; }, 3000);
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
</style>
