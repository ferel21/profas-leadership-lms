# context/

Reserved for React Context providers (global UI/auth/theme state shared across
many components). The codebase doesn't have any `createContext` usage yet —
server-fetched data is passed down as props instead — so this folder is
currently empty. Add providers here once a genuine cross-cutting client state
need shows up, instead of prop-drilling through many layers.
