<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
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
          class="inline-flex items-center gap-2 bg-violet-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-violet-700 transition-colors shadow-sm disabled:opacity-60">
          <svg v-if="saving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
          {{ saving ? 'Salvando...' : 'Salvar Alterações' }}
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-slate-100 p-1 rounded-2xl mb-6 w-fit">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
        :class="['px-4 py-2 rounded-xl text-sm font-medium transition-all', activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700']">
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab: Identidade -->
    <div v-show="activeTab === 'identity'" class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
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

      <div class="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
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
        <div class="grid grid-cols-3 gap-4">
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
        class="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
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
          <div class="flex items-center gap-2 mb-3 px-3 py-2 bg-sky-50 border border-sky-100 rounded-xl">
            <svg class="w-4 h-4 text-sky-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <p class="text-xs text-sky-700 leading-snug">
              <span class="font-semibold">Tamanho recomendado: 1440 × 420 px</span>
              <span class="text-sky-400 mx-1">·</span>Proporção 16:5
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

      <div class="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 class="font-semibold text-slate-900">Barra de Anúncio</h2>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Texto</label>
          <input v-model="form.announcementBarText" placeholder="Deixe em branco para ocultar a barra"
            class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
        </div>
        <div v-if="form.announcementBarText">
          <label class="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Cor de fundo</label>
          <div class="flex items-center gap-2">
            <input type="color" v-model="form.announcementBarColor" class="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5 flex-shrink-0" />
            <input v-model="form.announcementBarColor" class="w-32 rounded-xl border border-slate-200 px-2 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-500" />
            <span class="text-xs px-3 py-1.5 rounded-full font-semibold text-white" :style="{ background: form.announcementBarColor }">
              {{ form.announcementBarText }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: Redes Sociais -->
    <div v-show="activeTab === 'social'" class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 class="font-semibold text-slate-900">Redes Sociais</h2>
        <div class="space-y-3">
          <div v-for="s in socialFields" :key="s.key" class="flex items-center gap-3">
            <span class="text-xl w-8 text-center flex-shrink-0">{{ s.icon }}</span>
            <div class="flex-1">
              <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{{ s.label }}</label>
              <input v-model="(form.socialLinks as any)[s.key]" :placeholder="s.placeholder"
                class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: SEO -->
    <div v-show="activeTab === 'seo'" class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
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

      <div class="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
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
  { key: 'instagram', label: 'Instagram', icon: '📸', placeholder: 'https://instagram.com/suaconta' },
  { key: 'whatsapp', label: 'WhatsApp', icon: '💬', placeholder: '5511999999999' },
  { key: 'facebook', label: 'Facebook', icon: '👤', placeholder: 'https://facebook.com/suapagina' },
  { key: 'youtube', label: 'YouTube', icon: '▶️', placeholder: 'https://youtube.com/@seucanal' },
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
