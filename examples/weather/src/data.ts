import { ref } from 'vue'

export const creatures = ref<any>([])
export const moveableArea = {
  left: 0,
  right: 800 - 50,
  top: 0,
  bottom: 600 - 50,
}
export const fps = ref(0)
