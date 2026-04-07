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
      <div class="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-gray-900">Banner Principal</h2>
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" v-model="form.bannerEnabled" class="rounded" />
            <span class="text-gray-600">Ativo</span>
          </label>
        </div>

        <div v-if="form.bannerEnabled" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppInput v-model="form.bannerTitle" label="Título" />
            <AppInput v-model="form.bannerSubtitle" label="Subtítulo" />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppInput v-model="form.bannerCtaText" label="Texto do Botão" placeholder="Ver Produtos" />
            <AppInput v-model="form.bannerCtaLink" label="Link do Botão" placeholder="/catalogo" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 block mb-2">Imagem de fundo (opcional)</label>
            <div class="flex items-center gap-3">
              <img v-if="form.bannerImageUrl" :src="form.bannerImageUrl" class="h-14 w-24 rounded-xl object-cover" />
              <input type="file" accept="image/*" @change="(e) => uploadAsset(e, 'bannerImageUrl')" class="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
            </div>
          </div>

          <!-- Preview -->
          <div class="rounded-2xl overflow-hidden">
            <div class="p-6 text-white" :style="{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})` }">
              <p class="font-bold text-lg">{{ form.bannerTitle || 'Título do Banner' }}</p>
              <p class="text-sm opacity-80 mt-1">{{ form.bannerSubtitle || 'Subtítulo' }}</p>
              <span class="mt-3 inline-block bg-white text-xs font-bold px-4 py-2 rounded-xl" :style="{ color: form.primaryColor }">
                {{ form.bannerCtaText || 'Ver Produtos' }}
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
import api from '@/services/api';

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
  const fd = new FormData();
  fd.append('file', file);
  const res = await api.post('/admin/uploads/public', fd);
  (form as any)[field] = res.data.url;
}

async function saveConfig() {
  saving.value = true;
  saved.value = false;
  try {
    await siteConfigStore.update({ ...form });
    saved.value = true;
    setTimeout(() => (saved.value = false), 2500);
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Erro ao salvar.');
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  Object.assign(form, JSON.parse(JSON.stringify(siteConfigStore.config)));
  form.socialLinks = { ...siteConfigStore.config.socialLinks };
});
</script>
