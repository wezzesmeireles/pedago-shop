<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Customizar Site</h1>
      <div class="flex items-center gap-3">
        <span v-if="saved" class="text-sm text-green-600 font-medium flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          Salvo!
        </span>
        <AppButton @click="saveConfig" :loading="saving" variant="primary" size="sm">Salvar Alterações</AppButton>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-6 w-fit">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
        :class="['px-4 py-2 rounded-xl text-sm font-medium transition-all', activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700']">
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab: Identidade -->
    <div v-show="activeTab === 'identity'" class="space-y-4">
      <div class="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h2 class="font-semibold text-gray-900">Dados da Loja</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AppInput v-model="form.storeName" label="Nome da Loja" required />
          <AppInput v-model="form.storeDescription" label="Descrição Curta" />
        </div>
        <AppInput v-model="form.footerText" label="Texto do Rodapé" />
      </div>

      <div class="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h2 class="font-semibold text-gray-900">Logo</h2>
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
            <img v-if="form.logoUrl" :src="form.logoUrl" class="w-full h-full object-contain p-1" />
            <svg v-else class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
          <div>
            <input type="file" accept="image/*" @change="(e) => uploadAsset(e, 'logoUrl')" class="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
            <p class="text-xs text-gray-400 mt-1">PNG, SVG ou WebP — recomendado fundo transparente</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 shadow-sm">
        <h2 class="font-semibold text-gray-900 mb-4">Cores</h2>
        <div class="grid grid-cols-3 gap-4">
          <div v-for="c in colorFields" :key="c.key">
            <label class="text-xs font-medium text-gray-600 block mb-2">{{ c.label }}</label>
            <div class="flex items-center gap-2">
              <input type="color" v-model="(form as any)[c.key]" @input="applyLiveColors" class="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 p-0.5" />
              <input v-model="(form as any)[c.key]" @input="applyLiveColors" class="flex-1 rounded-xl border border-gray-200 px-2 py-1.5 text-xs font-mono" placeholder="#000000" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: Banner & Anúncio -->
    <div v-show="activeTab === 'banner'" class="space-y-4">
      <!-- 3 rotating banners -->
      <div
        v-for="(slide, idx) in form.banners"
        :key="idx"
        class="bg-white rounded-2xl p-6 shadow-sm space-y-4"
      >
        <div class="flex items-center gap-3 mb-2">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm"
               :style="{ background: bannerGradients[idx % bannerGradients.length] }">
            {{ idx + 1 }}
          </div>
          <h2 class="font-semibold text-gray-900">Banner {{ idx + 1 }}</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AppInput v-model="slide.title" label="Título" />
          <AppInput v-model="slide.subtitle" label="Subtítulo" />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AppInput v-model="slide.ctaText" label="Texto do Botão" placeholder="Ver Produtos" />
          <AppInput v-model="slide.ctaLink" label="Link do Botão" placeholder="/catalogo" />
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700 block mb-2">Imagem de fundo (opcional)</label>
          <!-- Size guide -->
          <div class="flex items-center gap-2 mb-3 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl">
            <svg class="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <div class="text-xs text-blue-700 leading-snug">
              <span class="font-semibold">Tamanho recomendado: 1440 × 420 px</span>
              <span class="text-blue-500 mx-1">·</span>
              Proporção 16:5
              <span class="text-blue-500 mx-1">·</span>
              Formato: JPG ou PNG
              <span class="text-blue-500 mx-1">·</span>
              Máx. 2 MB
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="relative flex-shrink-0">
              <img v-if="slide.imageUrl" :src="slide.imageUrl" class="h-14 w-24 rounded-xl object-cover border border-gray-200" />
              <div v-else class="h-14 w-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 text-gray-300">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <span v-if="slide.imageUrl && bannerSizes[idx]" class="absolute -bottom-5 left-0 text-[10px] text-gray-400 whitespace-nowrap">
                {{ bannerSizes[idx] }}
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <input type="file" accept="image/*" @change="(e) => uploadBannerImage(e, idx)"
                class="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
              <button v-if="slide.imageUrl" type="button" @click="slide.imageUrl = ''; bannerSizes[idx] = ''"
                class="text-xs text-red-500 hover:underline text-left">Remover imagem</button>
            </div>
          </div>
        </div>

        <!-- Mini preview -->
        <div class="rounded-xl overflow-hidden border border-gray-100">
          <div
            class="p-4 text-white relative"
            :style="slide.imageUrl
              ? { backgroundImage: `url(${slide.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: bannerGradients[idx % bannerGradients.length] }"
          >
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

      <div class="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h2 class="font-semibold text-gray-900">Barra de Anúncio</h2>
        <AppInput v-model="form.announcementBarText" label="Texto" placeholder="Deixe em branco para ocultar a barra" />
        <div v-if="form.announcementBarText">
          <label class="text-xs font-medium text-gray-600 block mb-2">Cor de fundo</label>
          <div class="flex items-center gap-2">
            <input type="color" v-model="form.announcementBarColor" class="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 p-0.5" />
            <input v-model="form.announcementBarColor" class="w-32 rounded-xl border border-gray-200 px-2 py-1.5 text-xs font-mono" />
            <span class="text-xs px-3 py-1.5 rounded-full font-medium text-white" :style="{ background: form.announcementBarColor }">
              {{ form.announcementBarText }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: Redes Sociais -->
    <div v-show="activeTab === 'social'" class="space-y-4">
      <div class="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h2 class="font-semibold text-gray-900">Redes Sociais</h2>
        <div class="space-y-3">
          <div v-for="s in socialFields" :key="s.key" class="flex items-center gap-3">
            <span class="text-lg w-6 text-center flex-shrink-0">{{ s.icon }}</span>
            <AppInput v-model="(form.socialLinks as any)[s.key]" :label="s.label" :placeholder="s.placeholder" class="flex-1" />
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: SEO -->
    <div v-show="activeTab === 'seo'" class="space-y-4">
      <div class="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h2 class="font-semibold text-gray-900">SEO</h2>
        <AppInput v-model="form.seoTitle" label="Título da página (meta title)" />
        <div>
          <label class="text-sm font-medium text-gray-700 block mb-1">Descrição SEO (meta description)</label>
          <textarea v-model="form.seoDescription" rows="3" maxlength="160" class="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"></textarea>
          <p class="text-xs text-gray-400 mt-1 text-right">{{ form.seoDescription?.length ?? 0 }}/160</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 shadow-sm">
        <h2 class="font-semibold text-gray-900 mb-4">Outros</h2>
        <AppInput v-model="form.pixMessage" label="Mensagem do PIX no checkout" />
        <div class="mt-4">
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="form.maintenanceMode" class="rounded w-4 h-4" />
            <div>
              <p class="text-sm font-medium text-gray-700">Modo manutenção</p>
              <p class="text-xs text-gray-400">Exibe uma página de manutenção para visitantes</p>
            </div>
          </label>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { useSiteConfigStore } from '@/stores/site-config.store';
import type { SiteConfigData } from '@pedago/shared';
import AppInput from '@/components/ui/AppInput.vue';
import AppButton from '@/components/ui/AppButton.vue';
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

  // Read dimensions before upload
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
  } catch (err: any) {
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
