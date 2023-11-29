import { ArrowBack, DesignServices } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import { Box, Button, Card, Container, Stack, Typography } from '@mui/material'
import { useGetModel } from 'actions/model'
import { CreateReleaseParams, postFile, postRelease } from 'actions/release'
import { useRouter } from 'next/router'
import { FormEvent, useState } from 'react'
import Loading from 'src/common/Loading'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import ReleaseForm from 'src/model/beta/releases/ReleaseForm'
import Wrapper from 'src/Wrapper.beta'
import { FileWithMetadata, FlattenedModelImage } from 'types/interfaces'
import { getErrorMessage } from 'utils/fetcher'
import { isValidSemver } from 'utils/stringUtils'

export default function NewRelease() {
  const [semver, setSemver] = useState('')
  const [releaseNotes, setReleaseNotes] = useState('')
  const [isMinorRelease, setIsMinorRelease] = useState(false)
  const [artefacts, setArtefacts] = useState<File[]>([])
  const [artefactsMetadata, setArtefactsMetadata] = useState<FileWithMetadata[]>([])
  const [imageList, setImageList] = useState<FlattenedModelImage[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const { modelId }: { modelId?: string } = router.query
  const { model, isModelLoading, isModelError } = useGetModel(modelId)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!model) {
      return
    }

    if (!model.card.version) {
      return setErrorMessage('Please make sure your model has a schema set before drafting a release.')
    }

    if (!isValidSemver(semver)) {
      return setErrorMessage('Please set a valid semver value before drafing a release.')
    }

    setErrorMessage('')
    setLoading(true)

    const fileIds: string[] = []
    for (const artefact of artefacts) {
      const artefactMetadata = artefactsMetadata.find((metadata) => metadata.fileName === artefact.name)
      const postArtefactResponse = await postFile(
        artefact,
        model.id,
        artefact.name,
        artefact.type,
        artefactMetadata?.metadata,
      )

      if (!postArtefactResponse.ok) {
        setLoading(false)
        return setErrorMessage(await getErrorMessage(postArtefactResponse))
      }

      const res = await postArtefactResponse.json()
      fileIds.push(res.file._id)
    }

    const release: CreateReleaseParams = {
      modelId: model.id,
      semver,
      modelCardVersion: model.card.version,
      notes: releaseNotes,
      minor: isMinorRelease,
      fileIds: fileIds,
      images: imageList,
    }

    const response = await postRelease(release)

    if (!response.ok) {
      setLoading(false)
      return setErrorMessage(await getErrorMessage(response))
    }

    setLoading(false)

    const body = await response.json()
    router.push(`/beta/model/${modelId}/release/${body.release.semver}`)
  }

  const error = MultipleErrorWrapper(`Unable to load release page`, {
    isModelError,
  })
  if (error) return error

  return (
    <Wrapper fullWidth title='Draft New Release' page='Model'>
      {isModelLoading && <Loading />}
      {model && !isModelLoading && (
        <Container maxWidth='md'>
          <Card sx={{ my: 4, p: 4 }}>
            <Box component='form' onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <Link href={`/beta/model/${modelId}?tab=releases`}>
                  <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                    Back to model
                  </Button>
                </Link>
                <Stack spacing={2} alignItems='center' justifyContent='center'>
                  <Typography variant='h6' component='h1' color='primary'>
                    Draft New Release
                  </Typography>
                  <DesignServices color='primary' fontSize='large' />
                  <Typography>
                    A release takes a snapshot of the current state of the model code, artefacts and model card. Access
                    requests will be able to select for any release of a model for deployment.
                  </Typography>
                </Stack>
                <ReleaseForm
                  model={model}
                  formData={{
                    semver,
                    releaseNotes,
                    isMinorRelease,
                    artefacts,
                    imageList,
                  }}
                  onSemverChange={(value) => setSemver(value)}
                  onReleaseNotesChange={(value) => setReleaseNotes(value)}
                  onMinorReleaseChange={(value) => setIsMinorRelease(value)}
                  onArtefactsChange={(value) => setArtefacts(value)}
                  artefactsMetadata={artefactsMetadata}
                  onArtefactsMetadataChange={(value) => setArtefactsMetadata(value)}
                  onImageListChange={(value) => setImageList(value)}
                />
                <Stack alignItems='flex-end'>
                  <LoadingButton
                    variant='contained'
                    loading={loading}
                    type='submit'
                    disabled={!semver || !releaseNotes || !isValidSemver(semver)}
                    sx={{ width: 'fit-content' }}
                  >
                    Create Release
                  </LoadingButton>
                  <MessageAlert message={errorMessage} severity='error' />
                </Stack>
              </Stack>
            </Box>
          </Card>
        </Container>
      )}
    </Wrapper>
  )
}
