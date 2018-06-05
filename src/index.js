
const create = (getter, setter) => ({ getter, setter })

const view = (state, lens) => lens.getter(state)
const write = (state, lens, data) => lens.setter(data)(state)
const over = (state, lens, fn) => L.write(state, lens, fn(L.view(state, lens)))

const compose = (...lenses) => {
  const len = lenses.length;

  if (len === 0) {
    return L.create(s => s, v => s => s)
  }

  if (len === 1) {
    return lenses[0]
  }

  return L.create(
    (state) => lenses.reduce((current, lens) => L.view(current, lens), state),
    (value) => function traverse(state, index = 0) {
      const lens = lenses[index]
      return index === len
        ? value
        : lens.setter(traverse(lens.getter(state), index + 1))(state)
    }
  )
}

const prop = (name) => L.create(
  (state) => state[name],
  (value) => (state) => ({ ...state, [name]: value }),
)

const L = {
  create,
  view,
  write,
  over,
  compose,
  prop,
}

const createStore = (initialState) => {
  let lastState = initialState
  const listeners = []

  const subscribe = (fn) => {
    let isSubscribed = true
    listeners.push(fn)

    return function unsubscribe() {
      if (isSubscribed) {
        const index = listeners.indexOf(fn)
        listeners.splice(index, 1)
        isSubscribed = false
      }
    }
  }

  const update = () => {
    for (const listener of listeners) {
      listener(lastState)
    }
  }

  const getState = () => lastState

  const setState = (newState) => {
    lastState = newState
    update()
  }

  const updateState = (lens, dataOrFn) => {
    typeof dataOrFn === 'function'
      ? setState(L.over(getState(), lens, dataOrFn))
      : setState(L.write(getState(), lens, dataOrFn))
  }

  const readState = (lens) =>
    L.view(getState(), lens)

  const execute = (command, ...args) => command(...args)({
      updateState,
      readState,
      execute
    });

  return {
    execute,
    getState,
    readState,
    setState,
    subscribe,
    updateState,
  }
}

module.exports = {
  L,
  createStore,
}
