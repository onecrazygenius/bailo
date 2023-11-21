import qs from 'querystring'
import useSWR from 'swr'

import { ErrorInfo, fetcher } from '../utils/fetcher'

interface EntityResults {
  kind: string
  entities: string[]
}

export function useListUsers(q: string) {
  const { data, error, mutate } = useSWR<
    {
      results: EntityResults[]
    },
    ErrorInfo
  >(
    q.length >= 3
      ? `/api/v2/entities?${qs.stringify({
          q,
        })}`
      : null,
    fetcher,
  )

  return {
    mutateUsers: mutate,
    users: data ? data.results : [],
    isUsersLoading: !error && !data,
    isUsersError: error,
  }
}

interface UserResponse {
  user: {
    dn: string
  }
}

export function useGetCurrentUser() {
  const { data, error, mutate } = useSWR<UserResponse, ErrorInfo>(`/api/v2/entities/me`, fetcher)

  return {
    mutateCurrentUser: mutate,
    currentUser: data?.user || undefined,
    isCurrentUserLoading: !error && !data,
    isCurrentUserError: error,
  }
}
