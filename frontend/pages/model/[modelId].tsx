import { useGetModel } from 'actions/model'
import { useGetUiConfig } from 'actions/uiConfig'
import { useGetCurrentUser } from 'actions/user'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
import PageWithTabs from 'src/common/PageWithTabs'
import Title from 'src/common/Title'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import AccessRequests from 'src/model/AccessRequests'
import InferenceServices from 'src/model/InferenceServices'
import ModelImages from 'src/model/ModelImages'
import Overview from 'src/model/Overview'
import Releases from 'src/model/Releases'
import Settings from 'src/model/Settings'

export default function Model() {
  const router = useRouter()
  const { modelId }: { modelId?: string } = router.query
  const { model, isModelLoading, isModelError } = useGetModel(modelId)
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const currentUserRoles = useMemo(
    () =>
      model?.collaborators.find((collaborator) => collaborator.entity.split(':')[1] === currentUser?.dn)?.roles || [],
    [model, currentUser],
  )

  const tabs = useMemo(
    () =>
      model && uiConfig
        ? [
            { title: 'Overview', path: 'overview', view: <Overview model={model} /> },
            {
              title: 'Releases',
              path: 'releases',
              view: <Releases model={model} currentUserRoles={currentUserRoles} />,
              disabled: !model.card,
              disabledText: 'Select a schema to view this tab',
            },
            {
              title: 'Access Requests',
              path: 'access',
              view: <AccessRequests model={model} currentUserRoles={currentUserRoles} />,
              datatest: 'accessRequestTab',
              disabled: !model.card,
              disabledText: 'Select a schema to view this tab',
            },
            {
              title: 'Registry',
              path: 'registry',
              view: <ModelImages model={model} />,
            },
            {
              title: 'Inferencing',
              path: 'inferencing',
              view: <InferenceServices model={model} />,
              hidden: !uiConfig.inference.enabled,
            },
            { title: 'Settings', path: 'settings', view: <Settings model={model} /> },
          ]
        : [],
    [model, uiConfig, currentUserRoles],
  )

  function requestAccess() {
    router.push(`/model/${modelId}/access-request/schema`)
  }

  const error = MultipleErrorWrapper(`Unable to load model page`, {
    isModelError,
    isCurrentUserError,
    isUiConfigError,
  })
  if (error) return error

  return (
    <>
      <Title text={model ? model.name : 'Loading...'} />
      {(isModelLoading || isCurrentUserLoading || isUiConfigLoading) && <Loading />}
      {model && (
        <PageWithTabs
          title={model.name}
          tabs={tabs}
          displayActionButton={model.card !== undefined}
          actionButtonTitle='Request access'
          actionButtonOnClick={requestAccess}
          requiredUrlParams={{ modelId: model.id }}
          showCopyButton
          textToCopy={model.id}
        />
      )}
    </>
  )
}
