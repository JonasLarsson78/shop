<script setup lang="ts">
import GroupMenu from '../components/shop/GroupMenu.vue'
</script>

<template>
  <section class="shop-layout">
    <GroupMenu />

    <div class="home-hero card">
      <p class="home-kicker">Modern Hundshop</p>
      <h2>Stilrena produkter för en gladare hundvardag</h2>
      <p class="home-lead">Utvalda favoriter för lek, promenad och vila. Filtrera snabbt via grupper och fyll varukorgen
        på några sekunder.</p>

      <ul class="home-points">
        <li>Snabbt att hitta rätt produkter</li>
        <li>Tydliga grupper för varje behov</li>
        <li>Smidig checkout utan krångel</li>
      </ul>

      <div class="home-actions">
        <RouterLink class="button-link" to="/shop">Gå till butiken</RouterLink>
        <RouterLink class="button-link button-muted" to="/cart">Se varukorg</RouterLink>
      </div>

      <div class="home-scenes" aria-label="Hundmoment">
        <figure class="scene-card">
          <figcaption>Lekstund</figcaption>
        </figure>

        <figure class="scene-card">
          <figcaption>Matdags</figcaption>
        </figure>

        <figure class="scene-card">
          <figcaption>Promenad</figcaption>
        </figure>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.home-hero {
  max-width: 760px;
  background: linear-gradient(145deg, rgba($color-brand, 0.09) 0%, rgba($color-muted, 0.14) 100%);
}

.home-kicker {
  margin: 0;
  color: $color-text-soft;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.76rem;
  font-weight: 600;
}

h2 {
  margin: 0.35rem 0 0.7rem;
  line-height: 1.2;
}

.home-lead {
  margin: 0;
  color: $color-text-soft;
  max-width: 62ch;
}

.home-points {
  margin: 0.95rem 0 0;
  padding-left: 1.1rem;
  display: grid;
  gap: 0.35rem;
}

.home-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1.1rem;
}

.home-scenes {
  margin-top: 1.1rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(140px, 1fr));
  gap: 0.65rem;
}

.scene-card {
  margin: 0;
  border: 1px solid rgba($color-brand, 0.22);
  border-radius: $radius-md;
  background: $color-surface;

  figcaption {
    padding: 0.45rem 0.6rem;
    font-size: 0.9rem;
    font-weight: 600;
  }
}

@media (max-width: 760px) {
  .home-scenes {
    grid-template-columns: 1fr;
  }
}
</style>