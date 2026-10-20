<script setup>
defineProps({ title: { type: String, default: 'Boring Time' } })
</script>

<template>
  <header class="topbar">
    <RouterLink class="brand" to="/" aria-label="Boring Time, trang bắt đầu">Boring Time</RouterLink>
    <span class="page-title">{{ title }}</span>
    <nav class="topnav" aria-label="Điều hướng chính">
      <RouterLink to="/breathing">Tập thở</RouterLink>
      <RouterLink to="/history">Lịch sử</RouterLink>
      <RouterLink to="/reports">Báo cáo</RouterLink>
      <RouterLink to="/settings">Cài đặt</RouterLink>
    </nav>
  </header>
</template>
