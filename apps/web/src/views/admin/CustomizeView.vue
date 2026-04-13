<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h1 class="text-xl font-bold text-slate-900">Customizar Site</h1>
        <p class="text-sm text-slate-500 mt-0.5">Aparência, banners e redes sociais</p>
      </div>
      <div class="flex items-center gap-3">
        <Transition name="fade-check">
          <span v-if="saved" class="flex items-center gap-1.5 text-sm text-emerald-600 font-medium bg-emerald-50 px-3 py-1.5 rounded-xl">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            Salvo!
          </span>
        </Transition>
        <button @click="saveConfig" :disabled="saving"
          class="inline-flex items-center gap-2 bg-violet-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-violet-700 transition-colors shadow-sm disabled:opacity-60 flex-1 sm:flex-none justify-center">
          <svg v-if="saving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
          {{ saving ? 'Salvando...' : 'Salvar Alterações' }}
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-6 scrollbar-none">
      <div class="flex gap-1 bg-slate-100 p-1 rounded-2xl w-max">
        <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
          :class="['px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap', activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700']">
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Tab: Identidade -->
    <div v-show="activeTab === 'identity'" class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
        <h2 class="font-semibold text-slate-900">Dados da Loja</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Nome da Loja</label>
            <input v-model="form.storeName" required class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Descrição Curta</label>
            <input v-model="form.storeDescription" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Texto do Rodapé</label>
          <input v-model="form.footerText" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
        <h2 class="font-semibold text-slate-900">Logo</h2>
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 flex-shrink-0">
            <img v-if="form.logoUrl" :src="form.logoUrl" class="w-full h-full object-contain p-1" />
            <svg v-else class="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
          <div>
            <input type="file" accept="image/*" @change="(e) => uploadAsset(e, 'logoUrl')"
              class="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer" />
            <p class="text-xs text-slate-400 mt-1">PNG, SVG ou WebP — recomendado fundo transparente</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 class="font-semibold text-slate-900 mb-4">Cores</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div v-for="c in colorFields" :key="c.key">
            <label class="text-xs font-semibold text-slate-600 block mb-2 uppercase tracking-wide">{{ c.label }}</label>
            <div class="flex items-center gap-2">
              <input type="color" v-model="(form as any)[c.key]" @input="applyLiveColors"
                class="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5 flex-shrink-0" />
              <input v-model="(form as any)[c.key]" @input="applyLiveColors"
                class="flex-1 min-w-0 rounded-xl border border-slate-200 px-2 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-500" placeholder="#000000" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: Banner & Anúncio -->
    <div v-show="activeTab === 'banner'" class="space-y-4">
      <div v-for="(slide, idx) in form.banners" :key="idx"
        class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
               :style="{ background: bannerGradients[idx % bannerGradients.length] }">
            {{ idx + 1 }}
          </div>
          <h2 class="font-semibold text-slate-900">Banner {{ idx + 1 }}</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Título</label>
            <input v-model="slide.title" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Subtítulo</label>
            <input v-model="slide.subtitle" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Texto do Botão</label>
            <input v-model="slide.ctaText" placeholder="Ver Produtos" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Link do Botão</label>
            <input v-model="slide.ctaLink" placeholder="/catalogo" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Imagem de fundo</label>
          <div class="flex items-start gap-2 mb-3 px-3 py-2 bg-sky-50 border border-sky-100 rounded-xl">
            <svg class="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <p class="text-xs text-sky-700 leading-relaxed">
              <span class="font-semibold">Tamanho recomendado: 1440 × 420 px</span><br class="sm:hidden" />
              <span class="hidden sm:inline text-sky-400 mx-1">·</span>Proporção 16:5
              <span class="text-sky-400 mx-1">·</span>JPG ou PNG
              <span class="text-sky-400 mx-1">·</span>Máx. 2 MB
            </p>
          </div>
          <div class="flex items-center gap-3">
            <div class="relative flex-shrink-0">
              <img v-if="slide.imageUrl" :src="slide.imageUrl" class="h-14 w-24 rounded-xl object-cover border border-slate-200" />
              <div v-else class="h-14 w-24 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 text-slate-300">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <span v-if="slide.imageUrl && bannerSizes[idx]" class="absolute -bottom-5 left-0 text-[10px] text-slate-400 whitespace-nowrap">
                {{ bannerSizes[idx] }}
              </span>
            </div>
            <div class="flex flex-col gap-1.5">
              <input type="file" accept="image/*" @change="(e) => uploadBannerImage(e, idx)"
                class="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer" />
              <button v-if="slide.imageUrl" type="button" @click="slide.imageUrl = ''; bannerSizes[idx] = ''"
                class="text-xs text-red-500 hover:text-red-700 text-left transition-colors">Remover imagem</button>
            </div>
          </div>
        </div>

        <!-- Preview -->
        <div class="rounded-xl overflow-hidden border border-slate-100 mt-2">
          <div class="p-4 text-white relative"
            :style="slide.imageUrl
              ? { backgroundImage: `url(${slide.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: bannerGradients[idx % bannerGradients.length] }">
            <div v-if="slide.imageUrl" class="absolute inset-0 bg-black/40 rounded-xl"></div>
            <div class="relative z-10">
              <p class="font-bold text-base">{{ slide.title || 'Título do Banner' }}</p>
              <p class="text-xs opacity-80 mt-0.5">{{ slide.subtitle || 'Subtítulo' }}</p>
              <span class="mt-2 inline-block bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-lg">
                {{ slide.ctaText || 'Ver Produtos' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
        <h2 class="font-semibold text-slate-900">Barra de Anúncio</h2>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Texto</label>
          <input v-model="form.announcementBarText" placeholder="Deixe em branco para ocultar a barra"
            class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
        </div>
        <div v-if="form.announcementBarText">
          <label class="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Cor de fundo</label>
          <div class="flex flex-wrap items-center gap-2">
            <input type="color" v-model="form.announcementBarColor" class="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5 flex-shrink-0" />
            <input v-model="form.announcementBarColor" class="w-28 rounded-xl border border-slate-200 px-2 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-500" />
            <span class="text-xs px-3 py-1.5 rounded-full font-semibold text-white truncate max-w-[200px]" :style="{ background: form.announcementBarColor }">
              {{ form.announcementBarText }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: Redes Sociais -->
    <div v-show="activeTab === 'social'" class="space-y-3">
      <div v-for="s in socialFields" :key="s.key"
        class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 hover:border-slate-300 transition-colors">
        <div class="flex items-center gap-3 mb-3">
          <!-- Ícone colorido -->
          <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" :style="{ background: s.bg }">
            <span v-html="s.svg" class="w-5 h-5 text-white [&>svg]:w-5 [&>svg]:h-5 [&>svg]:fill-white"></span>
          </div>
          <span class="text-sm font-semibold text-slate-800 flex-1">{{ s.label }}</span>
          <span v-if="(form.socialLinks as any)[s.key]"
            class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex-shrink-0">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Ativo
          </span>
          <span v-else class="inline-flex items-center text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full flex-shrink-0 hidden sm:inline-flex">
            Não configurado
          </span>
        </div>
        <input v-model="(form.socialLinks as any)[s.key]" :placeholder="s.placeholder"
          class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-slate-50 focus:bg-white transition-colors" />
      </div>
    </div>

    <!-- Tab: SEO -->
    <div v-show="activeTab === 'seo'" class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
        <h2 class="font-semibold text-slate-900">SEO</h2>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Título da página (meta title)</label>
          <input v-model="form.seoTitle" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Descrição SEO (meta description)</label>
          <textarea v-model="form.seoDescription" rows="3" maxlength="160"
            class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"></textarea>
          <p class="text-xs text-slate-400 mt-1 text-right">{{ form.seoDescription?.length ?? 0 }}/160</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
        <h2 class="font-semibold text-slate-900">Outros</h2>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Mensagem do PIX no checkout</label>
          <input v-model="form.pixMessage" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
        </div>
        <label class="flex items-center gap-3 cursor-pointer group">
          <div class="relative flex-shrink-0">
            <input type="checkbox" v-model="form.maintenanceMode" class="sr-only peer" />
            <div class="w-10 h-6 bg-slate-200 peer-checked:bg-violet-600 rounded-full transition-colors"></div>
            <div class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
          </div>
          <div>
            <p class="text-sm font-medium text-slate-700">Modo manutenção</p>
            <p class="text-xs text-slate-400">Exibe uma página de manutenção para visitantes</p>
          </div>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { useSiteConfigStore } from '@/stores/site-config.store';
import type { SiteConfigData } from '@pedago/shared';
import { supabase } from '@/lib/supabase';

const siteConfigStore = useSiteConfigStore();
const saving = ref(false);
const saved = ref(false);
const activeTab = ref('identity');

const tabs = [
  { id: 'identity', label: 'Identidade' },
  { id: 'banner', label: 'Banner' },
  { id: 'social', label: 'Redes Sociais' },
  { id: 'seo', label: 'SEO' },
];

const bannerSizes = ref<string[]>(['', '', '']);

const bannerGradients = [
  'linear-gradient(135deg, #7C3AED, #EC4899)',
  'linear-gradient(135deg, #0EA5E9, #6366F1)',
  'linear-gradient(135deg, #10B981, #3B82F6)',
];

const colorFields = [
  { key: 'primaryColor', label: 'Cor Principal' },
  { key: 'secondaryColor', label: 'Cor Secundária' },
  { key: 'accentColor', label: 'Destaque' },
];

const socialFields = [
  {
    key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/suaconta',
    bg: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
  },
  {
    key: 'whatsapp', label: 'WhatsApp', placeholder: '5511999999999',
    bg: '#25D366',
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`,
  },
  {
    key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/suapagina',
    bg: '#1877F2',
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  },
  {
    key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@seucanal',
    bg: '#FF0000',
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  },
  {
    key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@suaconta',
    bg: '#010101',
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`,
  },
];

const form = reactive<SiteConfigData>({
  ...JSON.parse(JSON.stringify(siteConfigStore.config)),
  socialLinks: { ...siteConfigStore.config.socialLinks },
});

function applyLiveColors() {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', form.primaryColor);
  root.style.setProperty('--color-secondary', form.secondaryColor);
  root.style.setProperty('--color-accent', form.accentColor);
}

async function uploadAsset(event: Event, field: keyof SiteConfigData) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const ext = file.name.split('.').pop();
  const path = `site/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('product-covers').upload(path, file, { upsert: true });
  if (error) { alert('Erro ao enviar imagem.'); return; }
  const { data: urlData } = supabase.storage.from('product-covers').getPublicUrl(path);
  (form as any)[field] = urlData.publicUrl;
}

async function uploadBannerImage(event: Event, idx: number) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const img = new Image();
  const objectUrl = URL.createObjectURL(file);
  img.onload = () => {
    const kb = Math.round(file.size / 1024);
    const size = kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
    bannerSizes.value[idx] = `${img.width} × ${img.height} px · ${size}`;
    URL.revokeObjectURL(objectUrl);
  };
  img.src = objectUrl;

  const ext = file.name.split('.').pop();
  const path = `site/banner-${idx + 1}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('product-covers').upload(path, file, { upsert: true });
  if (error) { alert('Erro ao enviar imagem.'); return; }
  const { data: urlData } = supabase.storage.from('product-covers').getPublicUrl(path);
  form.banners[idx].imageUrl = urlData.publicUrl;
}

async function saveConfig() {
  saving.value = true;
  saved.value = false;
  try {
    await siteConfigStore.update({ ...form });
    saved.value = true;
    setTimeout(() => (saved.value = false), 2500);
  } catch {
    alert('Erro ao salvar.');
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  Object.assign(form, JSON.parse(JSON.stringify(siteConfigStore.config)));
  form.socialLinks = { ...siteConfigStore.config.socialLinks };
});
</script>

<style scoped>
.fade-check-enter-active, .fade-check-leave-active { transition: opacity 0.3s; }
.fade-check-enter-from, .fade-check-leave-to { opacity: 0; }
</style>
