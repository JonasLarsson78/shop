<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useShopStore } from '../../stores/shop'

const shopStore = useShopStore()
const isCreateExpanded = ref(false)

const groupForm = reactive({
  name: '',
})
const editingGroupId = ref<number | null>(null)
const editGroupName = ref('')

const addGroup = () => {
  shopStore.addGroup(groupForm.name)
  groupForm.name = ''
  isCreateExpanded.value = false
}

const toggleCreate = () => {
  isCreateExpanded.value = !isCreateExpanded.value
}

const startEditGroup = (groupId: number, groupName: string) => {
  editingGroupId.value = groupId
  editGroupName.value = groupName
}

const cancelEditGroup = () => {
  editingGroupId.value = null
  editGroupName.value = ''
}

const saveEditGroup = (groupId: number) => {
  shopStore.updateGroup(groupId, editGroupName.value)
  cancelEditGroup()
}

const removeGroup = (groupId: number) => {
  shopStore.deleteGroup(groupId)

  if (editingGroupId.value === groupId) {
    cancelEditGroup()
  }
}

const getGroupProductCount = (groupId: number) =>
  shopStore.products.filter((product) => product.groupId === groupId).length
</script>

<template>
  <div class="card">
    <div class="group-header">
      <h3>Produktgrupper</h3>
      <button type="button" class="button-muted" @click="toggleCreate">
        {{ isCreateExpanded ? 'Stäng' : '+ Lägg till grupp' }}
      </button>
    </div>

    <form
      v-if="isCreateExpanded"
      class="group-create-form"
      @submit.prevent="addGroup"
    >
      <label>
        Ny grupp
        <input v-model="groupForm.name" required type="text" />
      </label>
      <button type="submit" class="button-primary">Lägg till grupp</button>
    </form>

    <p v-if="shopStore.groups.length === 0">Inga grupper ännu.</p>

    <div v-else class="group-list">
      <article
        v-for="group in shopStore.groups"
        :key="group.id"
        class="group-item"
      >
        <form
          v-if="editingGroupId === group.id"
          class="group-edit-form"
          @submit.prevent="saveEditGroup(group.id)"
        >
          <input v-model="editGroupName" required type="text" />

          <div class="row-actions">
            <button type="submit">Spara</button>
            <button type="button" class="button-muted" @click="cancelEditGroup">
              Avbryt
            </button>
          </div>
        </form>

        <div v-else class="group-item-row">
          <div class="group-info">
            <p>{{ group.name }}</p>
            <small>{{ getGroupProductCount(group.id) }} produkter</small>
          </div>

          <div class="row-actions">
            <button type="button" @click="startEditGroup(group.id, group.name)">
              Edit
            </button>
            <button
              type="button"
              class="button-danger"
              @click="removeGroup(group.id)"
            >
              Delete
            </button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped lang="scss">
.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.35rem;

  h3 {
    margin: 0;
  }
}

.group-create-form {
  margin-bottom: 0.8rem;
}

.group-list {
  display: grid;
  gap: 0.55rem;
}

.group-item {
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  padding: 0.6rem;
}

.group-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;

  p {
    margin: 0;
    font-weight: 600;
  }
}

.group-info {
  display: grid;
  gap: 0.15rem;

  small {
    color: $color-text-soft;
    font-size: 0.82rem;
  }
}

.group-edit-form {
  display: grid;
  gap: 0.5rem;
}
</style>
