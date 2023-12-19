<script setup lang="ts">
import { ID } from '@seele'
import { creatures, fps } from './data'
import { Position, Temperature } from './seele/components';
</script>

<template>
  <div class="seele">
    <div class="creature-area">
      <div class="creature"
        v-for="item in creatures"
        :key="item[ID]"
        :style="{
          top: item[Position].y + 'px',
          left: item[Position].x + 'px',
          backgroundColor: item[Temperature] > 50 ? 'pink' : item[Temperature] < -50 ? 'aqua' : 'rgba(19, 29, 39, .5)',
        }"
      >
        <div class="text">{{ item[ID] }}</div>
        <div class="text">{{ item[Temperature] }}</div>
      </div>
    </div>

    <div class="statistics">
      <div class="row flex">
        <div class="key">FPS:</div>
        <div class="value">{{ fps }}</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.seele {
  display: flex;
  justify-content: center;
}

.creature-area {
  position: relative;
  width: 800px;
  height: 600px;
  border: 2px solid rgba(19, 29, 39, .1);
}
.creature {
  position: absolute;
  width: 50px;
  height: 50px;
  background-color: rgba(19, 29, 39, .5);
}

.flex,
.row {
  display: flex;
}

.key {
  margin-right: 4px;
}
</style>
