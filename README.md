#  💫 Iota

Manage stateful logic with class methods like the good ol' times, but with reuable hooks.

## Install

```
npm install iota-hook
```

## Quickstart

Create a ususable instance of iota to grab a remote api data via debounce from  incoming props


```js
import createIota from 'iota-hook'
import debounce from 'lodash.debounce'
import searchQuery from './searchQuery'

interface LocationSearchProps {
  query: string
}
interface LocationSearchState {
  searchResults: string[]
}

interface LocationCustomMethods = {
  search: (query: string) => Promise<void>
}

interface LocationSearchResults = {
  results: { city: string, country: string }[]
  amount: number
}


const useLocationHook = createIota<LocationSearchProps, LocationSearchState, LocationCustomMethods, LocationSearchResults>({
  init: (self) => {
    self.state = { searchResults: [] }
  },
  didUpdate: (self) => {
    const { props, prevProps } = self
    if (props.query !== prevProps.query) {
      self.search(props.query)
    }
  },
  didMount: (self) => {
    self.search = debounce(self.search, 1000)
  },
  search: async (self, arg) => {
    const results = await searchQuery(arg)
    self.setState({ searchResults: results })
  },
  render: (self) => {
    const { state } = self

    return {
      results: state.searchResults.map((location) => {
        const [city, country] = location.split(', ')
        return { city, country }
      }),
      amount: state.searchResults.length
    }
  }
})

```



Then you can reuse this in any component



```js
import useLocationHook from './useLocationHook'

function App() {
  const [searchText, setSearchText] = React.useState('')

  const data = useLocationHook({ query: searchText })

  console.log({ data }) // data is data created from render method in iota hook

  return (
    <div>
      <input type="text" onChange={(e) => setSearchText(e.target.value)} />
    </div>
  );
}


```
