<template>
  <section>
    <div class="admin-layout">
      <AdminProductCreateCard />
    </div>

    <AdminProductListCard />
  </section>
</template>

<script setup lang="ts">
import AdminProductCreateCard from '../../components/admin/AdminProductCreateCard.vue'
import AdminProductListCard from '../../components/admin/AdminProductListCard.vue'
</script>
