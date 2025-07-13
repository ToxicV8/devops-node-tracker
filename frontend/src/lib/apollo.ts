import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import toast from 'react-hot-toast'
import i18n from '../i18n'

const httpLink = createHttpLink({
  uri: `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${import.meta.env.VITE_GRAPHQL_ENDPOINT || '/graphql'}`,
})

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token')
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

const errorLink = onError(({ graphQLErrors, networkError }) => {

  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
      toast.error(`${i18n.t('graphql_error')}: ${message}`)
    })
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`)
    toast.error(i18n.t('network_error'))
  }
})

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          issues: {
            merge(_existing = [], incoming) {
              return incoming
            },
          },
          projects: {
            merge(_existing = [], incoming) {
              return incoming
            },
          },
        },
      },
    },
  }),
}) 