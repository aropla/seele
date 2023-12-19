/**
 * ❥ https://www.isaacsukin.com/news/2015/01/detailed-explanation-javascript-game-loops-and-timing
 * ❥ https://github.com/IceCreamYou/MainLoop.js
 */
export interface FpsWatcherOptions {
  fpsUpdateInterval?: number
  fpsAlpha?: number
}

const defaultFpsWatcherOptions: Required<FpsWatcherOptions> = {
  fpsUpdateInterval: 1000,
  fpsAlpha: 0.9,
}

export type FpsWatcher = {
  fps: number
  lastTimestamp: number
  framesSinceLastFpsUpdate: number
  setOptions: (options: FpsWatcherOptions) => void
  update: (timestamp: DOMHighResTimeStamp) => void
}

function FpsWatcher(rawOptions: FpsWatcherOptions): FpsWatcher {
  let options = normalizeOptions<FpsWatcherOptions>(rawOptions, {}, defaultFpsWatcherOptions)

  let fps = 60
  let lastTimestamp = 0
  let framesSinceLastFpsUpdate = 0

  return {
    get fps() {
      return fps
    },
    set fps(value) {
      fps = value
    },
    get lastTimestamp() {
      return lastTimestamp
    },
    set lastTimestamp(value) {
      lastTimestamp = value
    },
    get framesSinceLastFpsUpdate() {
      return framesSinceLastFpsUpdate
    },
    set framesSinceLastFpsUpdate(value) {
      framesSinceLastFpsUpdate = value
    },
    setOptions(newOptions) {
      options = normalizeOptions(newOptions)
    },
    update(timestamp) {
      if (timestamp > lastTimestamp + options.fpsUpdateInterval) {
        fps = options.fpsAlpha * framesSinceLastFpsUpdate * 1000 / (timestamp - lastTimestamp) + (1 - options.fpsAlpha) * fps

        lastTimestamp = timestamp
        framesSinceLastFpsUpdate = 0
      }

      framesSinceLastFpsUpdate += 1
    },
  }
}

export interface BaseLooperOptions {
  minFrameDelay?: number
  simulationTimestep?: number
  panicBorder?: number
}

export type LooperOptions = BaseLooperOptions & FpsWatcherOptions
export type BeforeUpdate = (timestamp: DOMHighResTimeStamp, frameDelta: number) => void
export type AfterUpdate = (fps: number, panic: boolean) => void
export type Render = (interp: number) => void
export type Update = (delta: number) => void

export interface Looper {
  fps: number
  running: boolean
  setOptions: (options: LooperOptions) => void
  resetFrameDelta: () => number
  setBeforeUpdate: (fn: BeforeUpdate) => Looper
  setAfterUpdate: (fn: AfterUpdate) => Looper
  setRender: (fn: Render) => Looper
  setUpdate: (fn: Update) => Looper
  start: () => void
  stop: () => void
}

const defaultLooperOptions: BaseLooperOptions = {
  minFrameDelay: 0,
  simulationTimestep: 1000 / 60,
  panicBorder: 60,
}

export function Looper(rawOptions: LooperOptions = {}): Looper {
  let options = normalizeOptions<LooperOptions>(rawOptions, {}, defaultLooperOptions)

  const fpsWatcher = FpsWatcher(options)

  let frameDelta = 0
  let lastTimestamp = 0
  let panic = false
  let updateSteps = 0

  let started = false
  let running = false
  let rafHandle: number

  const Noop = () => {}
  let beforeUpdate: BeforeUpdate = Noop
  let afterUpdate: AfterUpdate = Noop
  let render: Render = Noop
  let update: Update = Noop

  function _update(timestamp: DOMHighResTimeStamp) {
    rafHandle = requestAnimationFrame(_update)

    if (timestamp < lastTimestamp + options.minFrameDelay) {
      return
    }

    frameDelta += timestamp - lastTimestamp
    lastTimestamp = timestamp

    beforeUpdate(timestamp, frameDelta)

    fpsWatcher.update(timestamp)

    updateSteps = 0
    while (frameDelta >= options.simulationTimestep) {
      update(options.simulationTimestep)
      frameDelta -= options.simulationTimestep

      updateSteps += 1
      if (updateSteps >= options.panicBorder) {
        panic = true
        break
      }
    }

    render(frameDelta / options.simulationTimestep)
    afterUpdate(fpsWatcher.fps, panic)

    panic = false
  }

  return {
    get fps() {
      return fpsWatcher.fps
    },
    get running() {
      return running
    },
    setOptions(newOptions) {
      options = normalizeOptions(newOptions, options)
      fpsWatcher.setOptions(options)
    },
    resetFrameDelta() {
      const oldFrameDelta = frameDelta
      frameDelta = 0

      return oldFrameDelta
    },
    setBeforeUpdate(fn) {
      beforeUpdate = fn || beforeUpdate
      return this
    },
    setAfterUpdate(fn) {
      afterUpdate = fn || afterUpdate
      return this
    },
    setRender(fn) {
      render = fn || render
      return this
    },
    setUpdate(fn) {
      update = fn || update
      return this
    },
    start() {
      if (started) {
        return
      }

      started = true
      rafHandle = requestAnimationFrame(timestamp => {
        render(1)

        running = true

        lastTimestamp = timestamp
        fpsWatcher.lastTimestamp = timestamp
        fpsWatcher.framesSinceLastFpsUpdate = 0

        rafHandle = requestAnimationFrame(_update)
      })
    },
    stop() {
      started = false
      running = false
      cancelAnimationFrame(rafHandle)
    },
  }
}

function normalizeOptions<T>(rawOptions: T, currentOptions = {}, defaultOptions = {}): Required<T> {
  return {
    ...defaultOptions,
    ...currentOptions,
    ...rawOptions,
  } as Required<T>
}
