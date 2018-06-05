# Readme

## Optice

Like redux, but `no reducers`, `no actions`

### Usage

```bash
npm install optice
```

```js
import { L, createStore } from 'optice'

const initialState = {
  user: {
    name: '',
    email: '',
  },
  company: {
    name: '',
    okato: 0,
  }
}

const store = createStore(initialState)

const userLens = L.prop('user')
const companyLens = L.prop('company')

const nameLens = L.prop('name')
const emailLens = L.create(
  (state) => state.email,
  (email) => (state) => ({ ...state, email }),
)
// same as `L.prop('email')`

const userNameLens = L.compose(userLens, nameLens)
const companyNameLens = L.compose(companyLens, nameLens)

const fetchUser = async () => ({ name: 'Foo Bar', email: 'foo.bar@company.com' })

const loadUser = () => async ({ updateState }) => {
  updateState(userLens, await fetchUser())
}
```

In console should be this output:

```
BEFORE { name: '', email: '' } { name: '', okato: 0 }
UPDATE { name: 'Foo Bar', email: 'foo.bar@company.com' } { name: '', okato: 0 }
UPDATE { name: 'Foo Bar', email: 'foo.bar@company.com' } { name: 'Company', okato: 0 }
```


### API

#### `createStore`

```
createStore(initialState): Store
```
Create new store object.


#### `Store.execute`

```
store.execute(command: Function, ...args: any[]): result
```

Run command function with store methods `({ updateState, readState, execute })` and passed arguments.
Immediatly return result of command.

```js
const command = (a, b) => ({ updateState, readState, execute }) => {
  // read, update state
  // or execute another command
  return 1 + a + b
}

store.execute(command, 2, 1) === 4
```

#### `Store.getState`

```
store.getState(): State
```

Just return current state

#### `Store.readState`

```
store.readState(lens: Lens): Value
```

Read value from state through lens.

```js
const lens = L.prop('data')

const initialState = {
  data: 1
}

const store = createStore(initialState)
const value = store.readState(lens)

console.assert(value === 1)
```


#### `Store.setState`

```
store.setState(newState: State): void
```

*It notify all subscribers*. Replace state, returns nothing.

```js

const initial = { a: 1, b: 2 }

const store = createStore(initial)

store.subscribe(state => {
  console.log('updated')
  console.assert(state.a === 5)
})
store.setState({ a: 5, b: 10 })
```

#### `Store.subscribe`

```
store.subscribe(listener: Function): Function
```

Add listener to subscribers list, returns `unsubscribe` function.


```js
const store = createStore({ a: 1 })

const unsubscribe = store.subscribe(state => {
  console.log('update', state)
})

store.setState({ a: 2 }) // > update { a: 2 }

unsubscribe()
store.setState({ a: 3 }) // nothing
```

#### `Store.updateState`

```
store.updateState(lens: Lens, valueOrFunc: any | Function): void
```

*It notify all subscribers*. Update piece of state through lens.
If function passed update state with `L.over`, else use `L.write` to just set value.

```js
const lens = L.prop('a')

const store = createStore({ a: 1 })

store.updateState(lens, 2)
console.assert(store.getState().a === 2)

store.updateState(lens, value => value + 1)
console.assert(store.getState().a === 3)
```

#### `L.create`

```
L.create(getter: Function, setter: Function): Lens
```

Create new lens.

Getter is just function that received state. Should return piece of state.

Setter is function that received passed value, return function that received state. Should return new version of passed state.

Getter and Setter should be pure functions.

```js
const lens = L.create(
  state => state.value,
  value => state => ({ ...state, value }),
)
```

#### `L.view`

```
L.view(state: State, lens: Lens): any
```

Read value from state through lens.

```js
const lens = L.create(
  state => state.value,
  value => state => ({ ...state, value }),
)

const state = { value: 'foo' }
const value = view(state, lens)

console.assert(value === 'foo')
```

#### `L.write`

```
L.write(state: State, lens: Lens, value: any): State
```

Immutable update piece of state through lens. Return new version of state.

```js
const state = { foo: { bar: 1 } }

const fooLens = L.prop('foo')
const barLens = L.prop('bar')
const fooBarLens = L.compose(fooLens, barLens)

const newState = L.write(state, fooBarLens, 2)
console.assert(newState.foo.bar === 2)
```

#### `L.over`

```
L.over(state: State, lens: Lens, fn: (value) => value): State
```

Like `L.write` but use function to update value. Return new version of state.


```js
const state = { foo: 100 }

const fooLens = L.prop('foo')
const updater = (value) => value + value

const newState = L.over(state, fooLens, updater)
console.assert(L.view(state, fooLens) === 200)
```


#### `L.compose`

```
L.compose(...lenses: Lens[]): Lens
```

> L.compose can be used only for this lenses

Perform lens composition. Returns one lens.

If passed no lens, returns empty lens `L.create(s => s, v => s => s)`.

If passed one lens, returns its.

```js
const a = L.create(
  state => state.a,
  value => state => ({ ...state, a: value })
)

const b = L.create(
  state => state.b,
  value => state => ({ ...state, b: value })
)

const ab = L.compose(a, b)

// same as

const ab2 = L.create(
  state => state.a.b,
  value => state => ({ ...state, a: { ...state.a, b: value } }),
)
```

#### `L.prop`

```
L.prop(name: string): Lens
```

Makes lens to read/write property.

```js
const fooLens = L.prop('foo')
// Same as
const fooLens2 = L.create(
  state => state.foo,
  value => state => ({ ...state, value: foo })
)
```
